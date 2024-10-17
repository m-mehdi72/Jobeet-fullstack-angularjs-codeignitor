var affiliateMod = angular.module('affiliateMod', []);

affiliateMod.config(['$routeProvider', function ($routeProvider) {
    $routeProvider
        .when('/affiliate/api/:token', {
            template: '', // No HTML template is needed
            controller: 'AffiliateDataCtrl'
        })
        .otherwise({
            redirectTo: '/' // Redirect to root if invalid route
        });
}]);

affiliateMod.service('JobService', function ($http, $q) {
    this.getJobs = function (token, format, category, maxLength) { // Add maxLength parameter
        var deferred = $q.defer();

        // Load affiliate data to verify token
        $http.get('affiliate_data.json').then(function (affiliateResponse) {
            var affiliates = affiliateResponse.data;

            // Filter affiliates who have access
            var authorizedAffiliates = affiliates.filter(function (affiliate) {
                return affiliate.has_access;
            });

            // Check if token matches any authorized affiliate's API key
            var tokenIsValid = authorizedAffiliates.some(function (affiliate) {
                return affiliate.api_key === token;
            });

            if (!tokenIsValid) {
                console.error('Invalid token'); // Log invalid token error
                deferred.reject('Invalid token');
                alert('Invalid token'); 
                return;
            }

            console.log("Fetching job data..."); // Log before data fetch
            // Fetch job data
            $http.get('job_data.json').then(function (response) {
                var jobData = response.data;
                console.log("Job data loaded successfully:", jobData); // Log job data loaded

                // Filter jobs to include only active and public jobs
                jobData = jobData.filter(function (job) {
                    return job.status === 'active' && job.public === true; // Ensure job is active and public
                });
                

                // Filter by category if specified
                if (category) {
                    jobData = jobData.filter(function (job) {
                        return job.category === category;
                    });
                    
                }

                // Limit the number of jobs based on max_length
                if (maxLength) {
                    jobData = jobData.slice(0, maxLength); // Limit the job data
                    
                }

                // Process format
                if (format === 'json') {
                    console.log("Resolving job data as JSON"); // Log JSON resolution
                    deferred.resolve(jobData);
                } else if (format === 'xml') {
                    console.log("Resolving job data as XML"); // Log XML resolution
                    deferred.resolve(jsonToXml(jobData));
                } else if (format === 'yaml') {
                    console.log("Resolving job data as YAML"); // Log YAML resolution
                    deferred.resolve(jsonToYaml(jobData));
                } else {
                    console.error('Unsupported format'); // Log unsupported format error
                    deferred.reject('Unsupported format');
                }
            }).catch(function (error) {
                console.error('Error loading job data:', error); // Log any errors during data load
                deferred.reject('Error loading job data');
                alert('Error loading job data'); 
            });
        }).catch(function (error) {
            console.error('Error loading affiliate data:', error); // Log any errors during affiliate data load
            deferred.reject('Error loading affiliate data');
            alert('Error loading affiliate data'); 
        });

        return deferred.promise; // Ensure this is outside the nested .then functions
    };

    // Convert JSON to XML
    function jsonToXml(json) {
        var xml = '<jobs>';
        json.forEach(function (job) {
            xml += `<job>
                        <id>${job.id}</id>
                        <position>${job.position}</position>
                        <company>${job.company}</company>
                        <location>${job.location}</location>
                        <description>${job.description}</description>
                        <expires_at>${job.expires_at}</expires_at>
                        <category>${job.category}</category>
                    </job>`;
        });
        xml += '</jobs>';
        console.log("Converted job data to XML:", xml); // Log converted XML
        return xml;
    }

    // Convert JSON to YAML
    function jsonToYaml(json) {
        const yamlData = jsyaml.dump(json); // Requires js-yaml library
        console.log("Converted job data to YAML:", yamlData); // Log converted YAML
        return yamlData;
    }
});


// AffiliateDataCtrl for displaying job data based on URL parameters
affiliateMod.controller('AffiliateDataCtrl', function ($scope, $location, JobService) {
    var params = $location.path().split('/'); // Get path segments
    var token = params[3]; // Extract token from URL
    var queryParams = $location.search();
    var format = queryParams.format || 'json';
    var category = queryParams.category || '';
    var maxLength = queryParams.max_length ? parseInt(queryParams.max_length) : null; // Get max_length from search params

    console.log("Token from URL:", token); // Log the token from the URL
    console.log("Format from URL:", format); // Log the format from the URL
    console.log("Category from URL:", category); // Log the category from the URL
    console.log("Max Length from URL:", maxLength); // Log the max length from the URL

    // Only proceed with valid token
    if (!token) {
        console.error('No token provided'); // Log error for missing token
        alert('No token provided'); // Display error message
        return; // Exit if no token
    }

    JobService.getJobs(token, format, category, maxLength).then(function (data) {
        let dataString;

        // Format the data based on the requested format
        if (format === 'json') {
            dataString = JSON.stringify(data, null, 2);
            console.log("Formatted data as JSON:", dataString); // Log formatted JSON
        } else if (format === 'xml') {
            dataString = data; // Already converted to XML in JobService
            console.log("Formatted data as XML:", dataString); // Log formatted XML
        } else if (format === 'yaml') {
            dataString = data; // Already converted to YAML in JobService
            console.log("Formatted data as YAML:", dataString); // Log formatted YAML
        } else {
            $scope.errorMessage = 'Unsupported format';
            console.error("Error: Unsupported format"); // Log unsupported format error
            return;
        }

        // Open a new window and display the data
        const newWindow = window.open('', '_blank');
        if (newWindow) {
            newWindow.document.write('<html><head><title>Data Output</title></head><body>');
            newWindow.document.write('<pre>' + dataString + '</pre>');
            newWindow.document.write('</body></html>');
            newWindow.document.close();
        } else {
            console.error('Failed to open new window'); // Log error for window open failure
            alert('Failed to open new window'); // Display error message
        }

    }).catch(function (error) {
        console.error('Error:', error); // Log errors caught
        alert('Failed to open new window'); // Display error message
    });
});

