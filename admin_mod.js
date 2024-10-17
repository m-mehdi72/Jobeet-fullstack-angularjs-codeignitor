var adminMod = angular.module('adminMod', []);  

adminMod.factory('AuthService', function($window) {
    return {
        isLoggedIn: function() {
            return $window.sessionStorage.getItem('isAdminLoggedIn') === 'true';
        },
        logout: function() {
            $window.sessionStorage.removeItem('isAdminLoggedIn');
        }
    };
});

adminMod.config(function ($routeProvider) {
    $routeProvider
    .when('/admin', {
        templateUrl: 'admin_views/login.html',
        controller: 'AdminLoginCtrl'
    })
    .when('/admin/affiliates', {
        templateUrl: 'admin_views/affiliates.html',
        controller: 'AdminAffiliatesCtrl',
        resolve: {
            auth: function(AuthService, $location) {
                if (!AuthService.isLoggedIn()) {
                    $location.path('/admin');
                }
            }
        }
    })
    .when('/admin/panel', {
        templateUrl: 'admin_views/panel.html',
        controller: 'AdminPanelCtrl',
        resolve: {
            auth: function(AuthService, $location) {
                if (!AuthService.isLoggedIn()) {
                    $location.path('/admin');
                }
            }
        }
    })
    .when('/admin/jobs', {
        templateUrl: 'admin_views/jobs.html',
        controller: 'AdminJobsCtrl',
        resolve: {
            auth: function(AuthService, $location) {
                if (!AuthService.isLoggedIn()) {
                    $location.path('/admin');
                }
            }
        }
    })
    .when('/admin/job/edit/:id', {
        templateUrl: 'admin_views/edit_job.html',
        controller: 'AdminJobEditCtrl',
        resolve: {
            auth: function(AuthService, $location) {
                if (!AuthService.isLoggedIn()) {
                    $location.path('/admin');
                }
            }
        }
    })
    .when('/admin/edit-categories', {
        templateUrl: 'admin_views/edit_categories.html',
        controller: 'AdminEditCategoriesCtrl',
        resolve: {
            auth: function(AuthService, $location) {
                if (!AuthService.isLoggedIn()) {
                    $location.path('/admin');
                }
            }
        }
    })
    .when('/admin/affiliate/edit/:id', {
        templateUrl: 'admin_views/edit_affiliate.html',
        controller: 'AdminAffiliateEditCtrl',
        resolve: {
            auth: function(AuthService, $location) {
                if (!AuthService.isLoggedIn()) {
                    $location.path('/admin');
                }
            }
        }
    });
    
});

adminMod.controller('AdminLoginCtrl', function($scope, $location, $http, $window) {
    $scope.errorMessage = '';
    $scope.title = 'Admin Login';

    $scope.login = function(username, password) {
        $scope.credentials = {
            username: username,
            password: password
        };
        
        $http.post('http://192.168.0.165/api/admin/login', $scope.credentials)
            .then(function(response) {
                $scope.errorMessage = ''; // Clear any error message
                if (response.data.status === 'success') {
                    $window.sessionStorage.setItem('isAdminLoggedIn', true);
                    $location.path('/admin/panel');
                } else {
                    $scope.errorMessage = 'Invalid username or password.' + response.data.status;
                }
            })
            .catch(function(error) {
                console.error('Error:', error);

                if (error.status === 401) {
                    $scope.errorMessage = 'Invalid username or password.';
                } else {
                    $scope.errorMessage = 'An error occurred. Please try again later. Error: ' + error.status;
                }
            });
    };

    
});

adminMod.controller('AdminAffiliatesCtrl', function($scope, $http, $location, AuthService){
    $scope.title = 'Affiliates List';
    $http.get('affiliate_data.json').then(function(response){
        $scope.affiliates = response.data;
    });

    $scope.clearSearch = function () {
        $scope.affiliateSearch = '';
    };

    $scope.editAffiliate = function(affiliateId) {
        $location.path('/admin/affiliate/edit/' + affiliateId);
    };

    $scope.removeAffiliate = function(index){
        $scope.affiliates.splice(index, 1);
    };

    $scope.logout = function() {
        console.log('Pressed Logout');
        AuthService.logout();
        $location.path('/admin');
    }; 

});

adminMod.controller('AdminPanelCtrl', function($scope, $location, AuthService) {
    $scope.title = 'Admin Panel';
    
    $scope.logout = function() {
        console.log('Pressed Logout');
        AuthService.logout();
        $location.path('/admin');
    }; 
});


adminMod.controller('AdminJobsCtrl', function($scope, $http, $location, AuthService){
    $scope.title = 'Admin Jobs';
    $http.get('job_data.json').then(function(response){
        $scope.jobs = response.data;
    });

    $scope.editJob = function(jobId) {
        $location.path('admin/job/edit/' + jobId);
    };

    $scope.jobDetails = function(jobId) {
        $location.path('/job-details/'+jobId);
    };

    $scope.removeJob = function(index){
        $scope.jobs.splice(index, 1);
    };

    $scope.logout = function() {
        console.log('Pressed Logout');
        AuthService.logout();
        $location.path('/admin');
    }; 

});


adminMod.controller('AdminJobEditCtrl', function($scope, $routeParams, $http, AuthService){
    $scope.title = 'Admin Job Edit';

    const jobId = $routeParams.id;

    $http.get('job_data.json').then(function(response){
        $scope.job = response.data.find(job => job.id === parseInt(jobId));
        $scope.company = $scope.job.company;
        $scope.location = $scope.job.location;
        $scope.type = $scope.job.type;
        $scope.category = $scope.job.category;
        $scope.position = $scope.job.position;
        $scope.url = $scope.job.url;
        $scope.description = $scope.job.description;
        $scope.how_to_apply = $scope.job.how_to_apply;
        $scope.email = $scope.job.email;
        $scope.created = $scope.job.created_at;
        $scope.updated = $scope.job.updated_at;
        $scope.expires = new Date($scope.job.expires_at);
        $scope.status = $scope.job.status;
        $scope.is_public = $scope.job.public;
    });

    $http.get('categories.json').then(function(response){
        $scope.categories = response.data.categories;
    });

    $scope.logout = function() {
        console.log('Pressed Logout');
        AuthService.logout();
        $location.path('/admin');
    }; 

});

adminMod.controller('AdminEditCategoriesCtrl', function($scope, $http, AuthService){
    $scope.title = 'Edit Categories / Default Expiry';
    $scope.alertMessage = '';

    $http.get('categories.json').then(function(response){
        $scope.categories = response.data.categories;
    });
    $scope.addCategory = function(){
        if ($scope.categories.indexOf($scope.newCategory) !== -1) {
            $scope.alertMessage = 'Category already exists!';
        } else if ($scope.newCategory) {
            $scope.categories.unshift($scope.newCategory); 
            $scope.newCategory = ''; 
            $scope.alertMessage = ''; 
        }
    };
    $scope.removeCategory = function(index){
        $scope.categories.splice(index,1)
    };

    $scope.checkEnter = function(event) {
        if (event.keyCode === 13) { 
            $scope.addCategory();
        }
    };

    $scope.defaultExpiryDays = 30;

    $scope.setDefaultExpiryDays = function() {
        if ($scope.defaultExpiryDays) {
            // Logic to save or use the default expiry days
            console.log("Default expiry days set to:", $scope.defaultExpiryDays);
            // You may also want to save this value to a database or service
            // e.g., JobService.setDefaultExpiryDays($scope.defaultExpiryDays);
            $scope.alertMessage = "Default expiry days set to " + $scope.defaultExpiryDays;
        } else {
            $scope.alertMessage = "Please enter a valid number of days.";
        }
    };

    $scope.logout = function() {
        console.log('Pressed Logout');
        AuthService.logout();
        $location.path('/admin');
    }; 
    

});

adminMod.controller('AdminAffiliateEditCtrl', function($scope, $routeParams, $http, AuthService){
    $scope.title = 'Edit Affiliate';

    const affiliateId = $routeParams.id;

    $http.get('affiliate_data.json').then(function(response){
        $scope.affiliate = response.data.find(affiliate => affiliate.id === parseInt(affiliateId));
    });

    $scope.logout = function() {
        console.log('Pressed Logout');
        AuthService.logout();
        $location.path('/admin');
    }; 

})