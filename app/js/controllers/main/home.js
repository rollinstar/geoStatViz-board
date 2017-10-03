function HomeCtrl($state){
    'ngInject';

    const vm = this;
    vm.title = 'LINKIT-CARTOGRAM';

    /**
     * 임시 : 통계지도 시각화 세팅 화면 호출
     */
    vm.openStatMap = function(){
        console.log('open statistics map generator!');
        let params = {
            'map_id': 'abc'
        };
        $state.go('maps', params);
        // $location.path('/accounts/login');
    };  
}

export default {
    name: 'HomeCtrl',
    fn: HomeCtrl
};