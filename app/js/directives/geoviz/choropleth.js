function ChoroplethDirective() {
    
    return {
    restrict: 'EA',
    templateUrl: 'directives/geoviz/choropleth.html',
    scope: {
        title: '@',
        message: '@clickMessage'
    },
    link: (scope, element) => {
        element.on('click', () => {
        window.alert('Element clicked: ' + scope.message);
        });
    }
    };
}

export default {
    name: 'choroplethDirective',
    fn: ChoroplethDirective
};
    