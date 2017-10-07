function ChoroplethDirective() {
    /**
     * @name choroplethCtrl
     * @desc 
     * @type {Function}
     */
    function choroplethCtrl(ColorbrewerService){
        'ngInject'
        console.log('scope : ',scope);
        
        const vm = this;

        //color scale (도메인 범위와 색상을 매칭)
        // let colorScale = d3.scale.threshold()
        // .domain([0, 1000, 3000, 6000, 9000, 12000, 15000]) // max = 617
        // .range(['#fff7f3', '#fde0dd', '#fcc5c0', '#fa9fb5', '#f768a1', '#dd3497', '#ae017e', '#7a0177']);
        
        //set a column name for applying visualization
        vm.setColumnNm = function(){
            console.log(vm.layerColumnNm);
        };

        //set colorbrew from colorbrewer
        vm.setColorbrew = function(){
            console.log(vm.classColorbrew);
            let colorbrew = ColorbrewerService.getColorbrew(vm.classColorbrew, 5);

            console.log('colorbrew : ', colorbrew);
        };

        //data visualization classes scope
        scope.classifyNum = 1;
        vm.classes = [];
        for(let i = 0;i < scope.classifyNum;i++){
            vm.classes.push(i+1);
        }

        //transparent
        vm.opacity = 0;
        vm.changeOpacity = function(){
            console.log(vm.opacity/100);
        };

        //move to page for selecting statistic visualization method
        vm.setGeoViz = function(idx, num){
            scope.step = num;
        }

        //visualization map
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
    