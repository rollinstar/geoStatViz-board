function ChoroplethDirective() {
    /**
     * @name choroplethCtrl
     * @desc 
     * @type {Function}
     */
    function choroplethCtrl(ColorbrewerService, DataMakerService){
        'ngInject'

        // const d3 = require("d3");

        console.log('scope : ',scope);
        
        const vm = this;

        //배열 number형 데이터 sort
        function compare(num1, num2){
            return num1 - num2;
        }
        
        //colorbrew array
        vm.colorBrewerList = ['YlGn', 'YlGnBu', 'GnBu', 'BuGn', 'PuBuGn', 'PuBu', 'BuPu', 'RdPu', 'PuRd', 'OrRd', 'YlOrRd', 'YlOrBr', 'Purples', 'Blues', 'Greens', 'Oranges', 'Reds', 'Greys', 'PuOr', 'BrBG', 'PRGn', 'PiYG', 'RdBu', 'RdGy', 'RdYlBu', 'Spectral', 'RdYlGn', 'Accent', 'Dark2', 'Paired', 'Pastel1', 'Pastel2', 'Set1', 'Set2', 'Set3'];
        
        //set a column name for applying visualization
        vm.layerColumnNm = '';
        vm.valueClass = {           
            max: 0,
            min: 0
        };
        vm.setColumnNm = function(){
            let idx = scope.maps.vizLayerIdx;
            let layerObj = scope.maps.addedLayerMetaList[idx].data
            let values = DataMakerService.getValues(layerObj.features, vm.layerColumnNm);
            // values.sort(compare);
            console.log('values : ', values);
            console.log('values : ', Math.max(...values));
            console.log('values : ', Math.min(...values));
            vm.valueClass = {           //
                max: Math.max(...values),
                min: Math.min(...values)
            };
        }

        //data visualization classes scope
        vm.class = '3';
        //set colorbrew from colorbrewer
        vm.colorbrew = {};
        vm.getColorbrew = function(){
            console.log(vm.classColorbrew);
            if(vm.classColorbrew){
                vm.colorbrew = ColorbrewerService.getColorbrew(vm.classColorbrew);
                console.log(vm.colorbrew);
            }
        };

        //color scale (도메인 범위와 색상을 매칭)
        let colorScale;
        //color scale (도메인 범위와 색상을 매칭)
        // let colorScale = d3.scale.threshold()
        // .domain([0, 1000, 3000, 6000, 9000, 12000, 15000]) // max = 617
        // .range(['#fff7f3', '#fde0dd', '#fcc5c0', '#fa9fb5', '#f768a1', '#dd3497', '#ae017e', '#7a0177']);
        vm.classes = [];
        vm.setClasses = function(){
            // let idx = scope.maps.vizLayerIdx;
            // let values = scope.maps.addedLayerMetaList[idx].data.pro
            if(!vm.layerColumnNm){
                alert('Please select a column name');
                return;
            }
            vm.classes = [];
            colorScale = {};
            
            let values = [];
            if(vm.mode == 'equal'){
                let max = vm.valueClass.max;
                let min = vm.valueClass.min;
                let interval = Math.floor((max - min)/vm.class);
                
                for(let i = 0;i < vm.class;i++){
                    if(i === 0){
                        values.push(min);
                    }else{
                        let len = values.length - 1;
                        let value = values[len] + interval;
                        values.push(value);
                    }
                }
            }

            for(let i = 0;i < values.length;i++){
                vm.classes.push(values[i]);
            }
            console.log('values : ', values);
            console.log('vm.colorbrew[vm.class] : ', vm.colorbrew[vm.class]);
            colorScale = d3.scale.threshold().domain(values).range(vm.colorbrew[vm.class]);
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
        vm.applyViualization = function(){
            console.log('시각화 실행');
            let attributes = {
                layerColumnNm: vm.layerColumnNm,
                colorScale: colorScale,
                opacity: vm.opacity/100
            };
            if(!attributes.layerColumnNm){
                alert('Please select a column name');
                return;
            }else if(!attributes.colorScale){
                alert('Please select a color and class');
                return;
            }
            scope.maps.setVizualizationMap(attributes);
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
    