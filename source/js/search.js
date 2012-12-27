var fustion_table_id = '1xxoIwan9TAwkh_AMkmfYQKbyUdQAvbR5WTvtgzw';
var map;
var layerl0;
var styles = [];
var lastInfowindow = null;
var defaultZoom = 5;

ft2json.query(
  'SELECT * FROM 1xxoIwan9TAwkh_AMkmfYQKbyUdQAvbR5WTvtgzw',
  function(result) {
    console.log(result);
  }
);

var markers = {
  getData: function(){
   this.organizations = $("#marker-information").data("organizations");
  },
  drawOn: function(map){
    this.template = $("#infowindowTemplate").html();
    this.moreInfoTemplate = $("#moreInfoTemplate").html();
    this.getData();
    $.each(this.organizations, function(index, organization){
      var address = organization.addresses[0];
      if(address){
        var marker = new google.maps.Marker({
          position: new google.maps.LatLng(address.latitude, address.longitude),
          map: map,
          animation: google.maps.Animation.DROP,
          title: organization.name,
          icon: organization.icon,
          organization: organization
        });
        var infowindow = new google.maps.InfoWindow({
          content: Mustache.render(markers.template, organization),
          maxWidth: 300
        });
        google.maps.event.addListener(marker, 'click', function() {
          if (lastInfowindow) lastInfowindow.close();
          infowindow.open(map, marker);
          lastInfowindow = infowindow;
          $("#results").html(Mustache.render(markers.moreInfoTemplate, organization));
        });
      }
    });
  }
};
var geoLocalizator = {
  successHandler: function(position){
    newCenter = new google.maps.LatLng(position.coords.latitude, position.coords.longitude, {timeout: 5000});
    map.setCenter(newCenter);
    map.setZoom(15);
    var marker = new google.maps.Marker({
        position: newCenter,
        map: map,
        animation: google.maps.Animation.DROP,
        title: "Tu ubicación actual"
    });
  },
  errorHandler: function(msg){
    // console.log(msg);
  },
  centerMap: function(map){
    this.map = map;
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(this.successHandler, this.errorHandler);
    }
  }
};

function initialize() {
  map = new google.maps.Map(document.getElementById('map_canvas'), {
    center: new google.maps.LatLng(-33.65682940830173, -63.85107421875),
    zoom: defaultZoom
  });
  geoLocalizator.centerMap(map);
  var style = [
    {
      featureType: 'all',
      elementType: 'all',
      stylers: [
        { saturation: -90 }
      ]
    }
  ];
  var styledMapType = new google.maps.StyledMapType(style, {
    map: map,
    name: 'Styled Map'
  });
  map.mapTypes.set('map-style', styledMapType);
  map.setMapTypeId('map-style');
  markers.drawOn(map);
}

searcher = {
  search: function(cad){
    var reg_q = new RegExp(cad, "i");
    var that = this;
    this.results = [];
    this.geocoder.geocode({ 'address': cad }, this.geocoderSearch);

    $.each(this.organizations, function(index, organization){
      if(organization.name.search(reg_q) !== -1){
        that.results.push(organization);
      }
      if(organization.address.search(reg_q) !== -1){
        that.results.push(organization);
      }
      if(organization.services_offered.search(reg_q) !== -1){
        that.results.push(organization);
      }
      this.results = _.uniq(this.results);
    });
    return this.results;
  },
  geocoderSearch: function(results, status){
    switch(results.length){
      case 0:
        break;
      case 1:
        searcher.results.push({
          partial:   "address",
          address:   results[0].formatted_address,
          latitude:  results[0].geometry.location.lat(),
          longitude: results[0].geometry.location.lng()
        });
        searcher.results.reverse();
        map.setCenter(results[0].geometry.location);
        var marker = new google.maps.Marker({
            position: results[0].geometry.location,
            map: map,
            animation: google.maps.Animation.DROP,
            title: results[0].formatted_address
        });
        break;
      default:
        searcher.results = searcher.results.concat(
          _.map(results, function(result){
            return {
              partial:   "address",
              address:   result.formatted_address,
              latitude:  result.geometry.location.lat(),
              longitude: result.geometry.location.lng()
            };
          })
        );
    }
    searcher.drawResults();
  },
  drawResults: function(){
    var output = "";
    var that = this;
    $.each(this.results, function(index, result){
      if("partial" in result){
        output = output + Mustache.render(that.geoResultsTemplate, result);
      } else {
        output = output + Mustache.render(that.resultsTemplate, result);
      }
    });
    $("#results").html("<h4>Resultados</h4>" + output);
  },
  initialize: function(){
    this.geocoder = new google.maps.Geocoder();
    this.organizations = $("#marker-information").data("organizations");
    this.resultsTemplate = $("#resultsTemplate").html();
    this.geoResultsTemplate = $("#geoResultsTemplate").html();
    return this;
  },
  exec: function(cad){
    this.initialize();
    this.search(cad);
    return this;
  }
};

$(document).ready(function(){
  initialize();
  searcher.initialize(map);
  $("#btnSearch").click(function(event){
    event.preventDefault();
    searcher.exec($('#inputSearch').val());
  });
  $('#inputSearch').change(function(event){
    event.preventDefault();
    var cad = $(this).val();
    if(cad.length > 1){
      searcher.exec(cad);
    }
  });
  $("a.organization").live("click", function(event){
    event.preventDefault();
    var $this = $(this);
    newCenter = new google.maps.LatLng($this.data("latitude"), $this.data("longitude"));
    map.setCenter(newCenter);
  });
});