Meteor.startup(function () {
  console.log("------------------\nStarting server...\n------------------\n");
  updateData();
});

function updateData () {
  console.log("Updating...");
  var data = HTTP.get("https://firms.modaps.eosdis.nasa.gov/active_fire/text/Europe_24h.csv").content;
  if(data) {
    console.log("Parsing...");
    var fires = Baby.parse(data, {
      delimiter: ',',
      newline: '\n',
      header: true,
      skipEmptyLines: true
    });
    console.log("Adding new data...");
    var obj;
    var local;
    var minLat = 36.910;
    var maxLat = 42.155;
    var minLng = -9.505;
    var maxLng = -6.190;
    for (var i = fires.data.length - 1; i >= 0; i--) {
      if(fires.data[i].latitude >= minLat && fires.data[i].latitude <= maxLat) {
        if(fires.data[i].longitude >= minLng && fires.data[i].longitude <= maxLng) {
          if(fires.data[i].confidence >= 30) {
            var lat = fires.data[i].latitude;
            var lng = fires.data[i].longitude;
            var at = fires.data[i].acq_date;
            var existing = Fires.find({ type: "fogo", lat: lat, lng: lng, date: at });
            if(existing.count() > 0) {
              Fires.update({ type: "fogo", lat: lat, lng: lng, date: at }, { $set: { checked: true } });
            } else {
              var data = HTTP.get("http://api.geonames.org/findNearbyPlaceNameJSON?lat="+fires.data[i].latitude+"&lng="+fires.data[i].longitude+"&username=jpgpereira");
              if(data.statusCode == 200) {
                var loc = JSON.parse(data.content);
                if(loc.geonames){
                  local = JSON.parse(data.content).geonames[0].name;
                } else {
                  local = "Local desconhecido";
                }
              } else {
                console.log(data);
                local = "Local desconhecido";
              }
              Fires.insert({
                type: 'fogo',
                checked: true,
                lat: fires.data[i].latitude,
                lng: fires.data[i].longitude,
                date: fires.data[i].acq_date,
                data: {
                  lat: fires.data[i].latitude,
                  lng: fires.data[i].longitude,
                  confidence: fires.data[i].confidence,
                  date: fires.data[i].acq_date,
                  time: fires.data[i].acq_time,
                  temp: Math.round(fires.data[i].brightness-273.15),
                  local: local
                }
              });
            }
          }
        }
      }
    };
    console.log("Removing old data...");
    Fires.remove({ type: "fogo", checked: false });
    Fires.remove({ type: "date" });
    console.log("Reseting options...");
    var update = Fires.find({ type: "fogo" });
    update.forEach(function (fire) {
      Fires.update({ _id: fire._id }, { $set: { checked: false } });
    });
    var date = moment().tz("Europe/Lisbon").format("DD[/]MM[/]YYYY, [às] HH:mm[h]");
    Fires.insert({
      type: 'date',
      data: date
    });
    console.log("\nWaiting...\n");
    Meteor.setInterval(function(){
      updateData();
    }, 1500000);
  } else {
    console.log("Error getting data, trying again in a minute...\n");
    Meteor.setInterval(function(){
      updateData();
    }, 60000);
  }
}

Meteor.publish("fires", function () {
  return Fires.find({});
});