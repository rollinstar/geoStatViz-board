function GeoDataService(AppSettings, RestService) {
    'ngInject';
    
    const service = {};

    service.getGeoDataList = function(){
        const url = AppSettings.apiUrl.restUrl + 'api/test/abc';

        // return CommonService.post(url, params);
        return RestService.get(url);
    }

    return service;
}


export default {
    name: 'GeoDataService',
    fn: GeoDataService
};