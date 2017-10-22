function MapsCtrl($scope, LayerSrchService, GeoDataService){
    'ngInject';

    window['scope'] = $scope;

    const L = require('leaflet');
    // const sggGeo = require('../../common/data/sgg.js');

    const vm = this;
    vm.title = 'MAP GENERATOR';

    //leaflet 지도 생성 container
    let map = new L.Map('map');

    //지도 렌더링 시 view 설정
    // let center = [36.00313319699069, 127.606201171875];   //중심점 좌표 (Latitude (위도), Longitude (경도))
    let center = [35.1989, 129.0792];
    let zoomLevel = 11;                                    //지도 렌더링 시 보여줄 zoomlevel
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
        let layerObj = {
            layer: new L.geoJSON(layer.data, options),
            vizInfo: null
        };

        layers.push(layerObj);
        layers[i].layer.addTo(map);
    }

    /**
     * ===== ===== ===== ===== start ===== ===== ===== =====
     * functions of this controller object 
     * ===== ===== ===== ===== start ===== ===== ===== =====
     */

    //지도에서 레이어 추가/삭제
    vm.addedLayerDisplay = function(idx, $event){
        var checkbox = $event.target;
        var layer = layers[idx].layer;
        if(checkbox.checked){
            map.addLayer(layer);
        }else{
            map.removeLayer(layer);
        }
    }
    
    $scope.step = 1;    //레이어 시각화 페이지 단계 (1:레이어목록화면 2:시각화선택화면 3:시각화설정화면)
    vm.layerColumns = []   //column name array of selected layer
    vm.vizLayerIdx = -1;    //시각화를 적용할 레이어 index
    /**
     * move to geo vizualization page
     */
    vm.setGeoViz = function(idx, num){
        $scope.step = num;
        vm.vizLayerIdx = idx;
        if(idx == -1){
            vm.layerColumns = []
        }else{
            vm.layerColumns = vm.addedLayerMetaList[idx].keys;
        }
    }

    //공간데이터 시각화 선택
    vm.statViz = '';
    vm.selectGeoViz = function(id){
        $scope.step = 3;
        vm.statViz = id;
    }

    vm.setVizualizationMap = function(obj){
        let idx = vm.vizLayerIdx;
        let olayer = layers[idx].layer;
        map.removeLayer(olayer);
        layers[vm.vizLayerIdx].vizInfo = obj;
        let layer = vm.addedLayerMetaList[idx];
        let nLayer = new L.geoJSON(layer.data, {style:getStyle});
        
        console.log(layers[idx].layer);
        layers[idx].layer = nLayer;
        layers[idx].layer.addTo(map);
        // layers[vm.vizLayerIdx].layer.setStyle(getStyle())
    }

    vm.getLayerList = function(){
        console.log('test test test');
        GeoDataService.getGeoDataList().then(function(data){
            console.log(data);
        });
    }

    function getColor(value){
        let colorScale = layers[vm.vizLayerIdx].vizInfo.colorScale;
        let rgb = d3.rgb(colorScale(value));
        // console.log(rgb);
        return rgb;
    }

    //지도 스타일 생성
    function getStyle(feature) {
        let keyNm = layers[vm.vizLayerIdx].vizInfo.layerColumnNm
        let opacity = layers[vm.vizLayerIdx].vizInfo.opacity
        // console.log('test : ', getColor(feature.properties[keyNm]));
        return {
            fillColor: getColor(feature.properties[keyNm]),
            weight: 1,
            opacity: 1,
            color: 'black',
            fillOpacity: opacity
        };
    }
}

export default {
    name: 'MapsCtrl',
    fn: MapsCtrl
};