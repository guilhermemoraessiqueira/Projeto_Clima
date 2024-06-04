import React, { useEffect, useRef } from 'react';
import './App.css';

function App() {
  const mapRef = useRef(null);

  useEffect(() => {
    if (mapRef.current) {
      var TOKEN_ID = "b20ab09a6db83c06c606d07a6a78fa51cf57678b";
      var map = new google.maps.Map(mapRef.current, {
        center: new google.maps.LatLng(0, 0),
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        zoom: 3
      });

      var waqiMapOverlay = new google.maps.ImageMapType({
        getTileUrl: function (coord, zoom) {
          return 'https://tiles.aqicn.org/tiles/usepa-aqi/' + zoom + "/" + coord.x + "/" + coord.y + `.png?token=${TOKEN_ID}`;
        },
        name: "Air Quality",
      });

      map.overlayMapTypes.push(waqiMapOverlay);

      map.addListener('click', function (event) {
        var lat = event.latLng.lat();
        var lng = event.latLng.lng();
        fetchAQIData(lat, lng);
      });

      function fetchAQIData(lat, lng) {
        var apiUrl = `https://api.waqi.info/feed/geo:${lat};${lng}/?token=${TOKEN_ID}`;

        fetch(apiUrl)
          .then(response => response.json())
          .then(data => {
            if (data && data.status === 'ok') {
              var cityData = data.data.city;
              var cityName = cityData.name;
              var searchApiUrl = `https://api.waqi.info/search/?token=${TOKEN_ID}&keyword=${cityName}`;

              return fetch(searchApiUrl);
            } else {
              throw new Error('Nenhuma informação encontrada para este local.');
            }
          })
          .then(response => response.json())
          .then(data => {
            if (data && data.data.length > 0) {
              var getData = data.data[0];
              var stationData = getData.station;

              if (stationData.geo && stationData.geo.length >= 2) {
                var latStation = stationData.geo[0];
                var lngStation = stationData.geo[1];

                var centerLatLng = new google.maps.LatLng(latStation, lngStation);

                map.setCenter(centerLatLng);
                map.setZoom(15);

                loadAQIFeedScript(stationData.url);
              } else {
                console.error('Dados de localização ausentes ou incompletos no resultado.');
              }
            } else {
              console.error('Nenhum resultado encontrado na resposta.');
            }
          })
          .catch(error => {
            console.error('Ocorreu um erro:', error);
          });
      }

      function setupModal() {
        hideModal();
        showModal();
      }

      function showModal() {
        $('#infoModal').modal('show');
      }

      function hideModal() {
        $('#infoModal').modal('hide');
      }

      (function (w, d, t, f) {
        w[f] = w[f] || function (c, k, n) {
          var s = w[f];
          k = s['k'] = (s['k'] || (k ? ('&k=' + k) : ''));
          s['c'] = c = (c instanceof Array) ? c : [c];
          s['n'] = n = n || 0;
          var L = d.createElement(t);
          var e = d.getElementsByTagName(t)[0];
          L.async = 1;
          L.src = '//feed.aqicn.org/feed/' + (c[n].city) + '/' + (c[n].lang || '') + '/feed.v1.js?n=' + n + k;
          e.parentNode.insertBefore(L, e);
        };
      })(window, document, 'script', '_aqiFeed');

      function loadAQIFeedScript(cityUrl) {
        _aqiFeed({
          container: "city-aqi-container",
          display: "<div>%details</div>",
          city: cityUrl,
          lang: "pt"
        });

        setupModal();
      };

      document.getElementById("searchForm").addEventListener("submit", function (event) {
        event.preventDefault();
        var inputText = document.getElementById("textInput").value;
        var apiUrl = `https://api.waqi.info/search/?token=${TOKEN_ID}&keyword=${inputText}`;

        fetch(apiUrl)
          .then(response => response.json())
          .then(data => {
            if (data && data.data.length >= 0) {
              var getData = data.data[0];
              var stationData = getData.station;

              if (stationData.geo && stationData.geo.length >= 2) {
                var latStation = stationData.geo[0];
                var lngStation = stationData.geo[1];

                var centerLatLng = new google.maps.LatLng(latStation, lngStation);

                map.setCenter(centerLatLng);
                map.setZoom(15);

                loadAQIFeedScript(stationData.url);
              } else {
                console.error('Dados de localização ausentes ou incompletos no resultado.');
              }
            } else {
              console.error('Nenhum resultado encontrado na resposta.');
            }
          })
          .catch(error => {
            console.error('Ocorreu um erro:', error);
          });
      });
    }
  }, []);

  return (
    <div id="container">
      <div id="main">
        <div id='map' ref={mapRef}></div>
      </div>

      <div className="row" id="header-group">
        <form className="d-flex" id="searchForm">
          <input id="textInput" className="form-control me-2" type="search" placeholder="Pesquise por uma localização" aria-label="Search" />
          <button type="submit" className="btn btn-primary search-button">
            <i className="fas fa-search"></i>
          </button>
        </form>

        <div id="widgets">
          <div className="modal fade" id="infoModal" tabIndex="-1" aria-labelledby="infoModalLabel" aria-hidden="true">
            <div className="modal-dialog text-center">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title" id="infoModalLabel">Informações</h5>
                  <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                    <i className="fas fa-times fa-sm"></i>
                  </button>
                </div>
                <div className="modal-body">
                  <span id="city-aqi-container"></span>
                </div>
                <div className="alert alert-warning" role="alert">
                  Localização aproximada
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
