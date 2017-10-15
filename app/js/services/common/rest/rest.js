function RestService($http, $httpParamSerializer, AppSettings) {
    'ngInject';
  
    const service = {};
  
    // post, get 모두 URL 을 base64_encode + encodeURIComponent 처리함
    // get 방식일 경우 URL 자체에 parameter 가 많을 수도 있어서 proxy 에서 parameter 를 제대로 처리할 수 있도록 위와 같은 처리를 함
  
    service.post = function(url, params) {
      return new Promise((resolve, reject) => {
        $http({
          method: 'POST',
          url: url,
          data: params,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }).then((data) => {
          resolve(data.data);
        }, (err, status) => {
          reject(err, status);
        });
      });
    };
  
    service.get = function(url) {
      return new Promise((resolve, reject) => {
        $http.get(url).then((data) => {
          resolve(data.data);
        }, (err, status) => {
          reject(err, status);
        });
      });
    };
  
    return service;
  
  }
  
  export default {
    name: 'RestService',
    fn: RestService
  };
  