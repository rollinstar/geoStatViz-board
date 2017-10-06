function ChoroplethDirective() {
    /**
     * @name choroplethCtrl
     * @desc 
     * @type {Function}
     */
    function choroplethCtrl(){
        console.log('scope : ',scope);
        const vm = this;
        vm.layerColumns = scope.maps.addedLayerMetaList[0].keys;
        scope.classifyNum = 1;
        vm.classes = [];
        for(let i = 0;i < scope.classifyNum;i++){
            vm.classes.push(i);
        }

        vm.opacity = 0;
        vm.changeOpacity = function(){
            console.log(vm.opacity/100);
        }

        //페이지 전환 (지도 선택 화면으로 이동)
        vm.setGeoViz = function(idx, num){
            scope.step = num;
        }

        //지도 시각화 실행
        vm.visualizeGeoData = function(){
            console.log('시각화 실행');
        }
    }    

    /**
     * @name choroplethLink
     * @desc 
     * @type {Function}
     */
    function choroplethLink(scope, element){
        
    }

    return {
        restrict: 'EA',
        templateUrl: 'directives/geoviz/choropleth.html',
        scope: false,           //false: 새로운 scope 객체를 생성하지 않고 부모가 가진 같은 scope 객체를 공유. (default 옵션), true: 새로운 scope 객체를 생성하고 부모 scope 객체를 상속.
        link: choroplethLink,
        controllerAs: 'choroplethEditor',
        controller: choroplethCtrl
    };
}

export default {
    name: 'choroplethDirective',
    fn: ChoroplethDirective
};
    