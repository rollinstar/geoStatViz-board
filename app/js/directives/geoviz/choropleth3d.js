function Choropleth3dDirective() {

return {
    restrict: 'EA',
    templateUrl: 'directives/geoviz/choropleth3d.html',
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
  name: 'choropleth3dDirective',
  fn: Choropleth3dDirective
};
