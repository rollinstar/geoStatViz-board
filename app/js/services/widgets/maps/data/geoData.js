function GeoDataService(AppSettings, RestCommonService) {
    'ngInject';
    
    const service = {};

    service.getGeoDataList = function(){
        const url = AppSettings.apiUrl.restUrl + 'api/test/abc';

        // return CommonService.post(url, params);
        return RestCommonService.get(url);
    }

    return service;
}


export default {
    name: 'GeoDataService',
    fn: GeoDataService
};