function MapsCtrl($scope, TestService, LayerSrchService){
    'ngInject';

    window['scope'] = $scope;

    const L = require('leaflet');
    // const sggGeo = require('../../common/data/sgg.js');

    const vm = this;
    vm.title = 'MAP GENERATOR';

    //레이어 시각화 페이지 단계 (1:레이어목록화면 2:시각화선택화면 3:시각화설정화면)
    $scope.step = 1;
    vm.statViz = '';
    //leaflet 지도 생성 container
    let map = new L.Map('map');

    //지도 렌더링 시 view 설정
    let center = [36.00313319699069, 127.606201171875];   //중심점 좌표 (Latitude (위도), Longitude (경도))
    let zoomLevel = 7;                                    //지도 렌더링 시 보여줄 zoomlevel
    map.setView(center, zoomLevel, false);                //setView

    /**
     * Add tile map layer
     * tile map은 항상 가장 아래에 있어야 하므로
     * 가장 먼저 map객체에 Add한다.
     */
    let tileUrl = 'http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png';
    let tileLayerOptions = {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
        minZoom: 7,
        maxZoom: 18,
        maxNativeZoom: 20
    };

    let tileLayerObj = new L.TileLayer(tileUrl,tileLayerOptions);
    tileLayerObj.addTo(map);

     /**
     * 지도에 overlay될 layer목록
     * 기능
     * 1. 사용자 'ADD LAYER'버튼을 클릭
     * 2. 지도 추가하기(시스템 제공 지도 선택 or 사용자 지도 추가)
     * 2-1. 시스템 제공 지도 선택
     * 2-2. 사용자 지도 추가(geojson, csv, gml, kml, shp....)
     * step
     * step1. 레이어 목록 받아오기
     * step2. 레이어 목록을 addedLayerList에 할당
     */
    vm.addedLayerMetaList = LayerSrchService.getLayerList4MapGenerator();             //지도만들기에 추가된 레이어 목록

    let layerStyle = {
        fillColor:'#E4FD00',
        color: '#ff0000',
        weight: 0.3,
        opacity: 1,
        fillOpacity: 0.5
    };

    var options = {
        style: layerStyle
        // onEachFeature: onEachFeature,
    };

    let layers = [];        //
    for(let i = 0;i < vm.addedLayerMetaList.length;i++){
        let layer = vm.addedLayerMetaList[i];
        layers.push(new L.geoJSON(layer.data, options));
        layers[i].addTo(map);
    }


    /**
     * ===== ===== ===== ===== start ===== ===== ===== =====
     * functions of this controller object 
     * ===== ===== ===== ===== start ===== ===== ===== =====
     */

    //지도에서 레이어 추가/삭제
    vm.addedLayerDisplay = function(idx, $event){
        var checkbox = $event.target;
        var layer = layers[idx];
        if(checkbox.checked){
            map.addLayer(layer);
        }else{
            map.removeLayer(layer);
        }
    }

    //페이지 전환
    vm.setGeoViz = function(idx, num){
        $scope.step = num;
    }

    //공간데이터 시각화 선택
    vm.selectGeoViz = function(id){
        $scope.step = 3;
        vm.statViz = id;
    }
}

export default {
    name: 'MapsCtrl',
    fn: MapsCtrl
};