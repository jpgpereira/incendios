Meteor.startup(function () {
  GoogleMaps.load({libraries: 'visualization'});
});

Template.map.created = function () {
  this.autorun(function () {
    this.subscription = Meteor.subscribe('fires');
  }.bind(this));
};

Template._infoModal.helpers({
  lastUpdate: function () {
    var fireDate = Fires.find({type: 'date'});
    fireDate.forEach(function (date) {
      lastUpdate = date.data;
    });
    return lastUpdate;
  }
});

Template.map.rendered = function () {
  this.autorun(function () {
    if (!this.subscription.ready()) {
      IonLoading.show({
        backdrop: true,
        customTemplate: "<h3>A actualizar os dados</h3><p>Por favor aguarde...</p>"
      });
    } else {
      loadData(GoogleMaps.maps.map);
    }
  }.bind(this));
};

Template.map.helpers({
  mapOptions: function() {
    if (GoogleMaps.loaded()) {
      var center = {
        lat: 39.68424038,
        lng: -8.0846491
      };
      var zoom = 7;
      return {
        center: center,
        zoom: zoom,
        mapTypeId: google.maps.MapTypeId.HYBRID,
        disableDefaultUI: true
      };
    }
  }
});

function loadData (map) {
  GoogleMaps.ready('map', function(map) {
    var fireMarkers = Fires.find({type: 'fogo'});
    fireMarkers.forEach(function (fire) {
      var formatTime = fire.data.time.split("");
      if(formatTime.length > 4){
        if(formatTime[1] == "1" && formatTime[2] == "0") {
          var time = "09:"+formatTime[3]+formatTime[4]+"h";
        } else if(formatTime[1] == "2" && formatTime[2] == "0") {
          var time = "19:"+formatTime[3]+formatTime[4]+"h";
        } else {
          var time = formatTime[1]+(parseInt(formatTime[2])-1)+":"+formatTime[3]+formatTime[4]+"h";
        }
      } else {
        if(formatTime[1] == "0") {
          var time = "23:"+formatTime[2]+formatTime[3]+"h";
        } else {
          var time = "0"+(parseInt(formatTime[1])-1)+":"+formatTime[2]+formatTime[3]+"h";
        }
      }
      var latlng = new google.maps.LatLng(fire.data.lat, fire.data.lng);
      var marker = new google.maps.Marker({
        position: latlng,
        confidence: fire.data.confidence,
        local: fire.data.local,
        lat: fire.data.lat,
        lng: fire.data.lng,
        date: fire.data.date,
        time: time,
        temp: fire.data.temp
      });
      if (fire.data.confidence < 50) {
        var color = '#FBC02D';
      } else if (fire.data.confidence >= 50 && fire.data.confidence <= 75) {
        var color = '#E65100';
      } else if (fire.data.confidence >= 75) {
        var color = '#b71c1c';
      }
      var circleOptions = {
        strokeColor: color,
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: color,
        fillOpacity: fire.data.temp/100,
        map: map.instance,
        center: latlng,
        radius: 1000
      };
      circle = new google.maps.Circle(circleOptions);
      google.maps.event.addListener(circle, "click", function() {
        IonPopup.alert({
          title: marker.local,
          template: '<p><b>Local:</b> '+marker.lat+'º '+marker.lng+'<p><b>Data:</b> '+marker.date+'<p><b>Hora:</b> '+time+'<p><b>Temperatura:</b> '+marker.temp+'ºC<p><b>Certeza:</b> '+marker.confidence+'%',
          okText: 'Fechar',
          okType: 'button-royal',
        });
      });
    });
    var fireDate = Fires.find({type: 'date'});
    fireDate.forEach(function (date) {
      lastUpdate = date.data;
    });
    IonLoading.hide();
  });
}