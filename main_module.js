var app = angular.module('myMod', ['ngRoute', 'ngSanitize', 'adminMod', 'affiliateMod', 'ngAnimate'])
    .controller('MainController', ['$scope', '$location', '$interval', '$http', '$rootScope', function ($scope, $location, $interval, $http, $rootScope) {

        // Watch for changes in the route
        $scope.$on('$routeChangeSuccess', function () {

            const currentPath = $location.path();
            if (currentPath.startsWith('/admin')) {
                $scope.bgClass = 'bg-view-black';
            } else if (currentPath === '/home' || currentPath === '/info') {
                $scope.bgClass = 'bg-view-yellow';
            } else {
                $scope.bgClass = 'bg-default';
            }

        });

        $scope.copyToClipboard = function (textToCopy) {
            // Copy text to the clipboard
            navigator.clipboard.writeText(textToCopy).then(function () {
                alert("Text copied to clipboard!");
            }).catch(function (error) {
                console.error("Could not copy text: ", error);
                alert("Failed to copy text.");
            });
        };


        $scope.goToPage = function (path) {
            $location.path(path);
        };

        $scope.activeTab = '';

        $scope.$on('$routeChangeSuccess', function () {
            $scope.activeTab = $location.path();
        });

        $scope.isActive = function (tab) {
            return $scope.activeTab === tab;
        }

        $scope.title = 'Post Job';
        $scope.jobData = {}; // Initialize jobData object
        $scope.jobData.type = 'Full-Time'; // Set a default value for the job type

        // Define modal visibility flags
        $scope.showJobPostPage = false;
        $scope.showJobPostOverlay = false;
        $scope.showEditURL = false;

        // Toggle modals based on ID
        $scope.toggleModal = function (modalId) {
            if (modalId === 'jobPostPage') {
                $scope.showJobPostPage = !$scope.showJobPostPage;
            } else if (modalId === 'jobPostOverlay') {
                $scope.showJobPostOverlay = !$scope.showJobPostOverlay;
            } else if (modalId === 'editURL') {
                $scope.showEditURL = !$scope.showEditURL;
            }
        };
        // Set a future expiry date dynamically
        $interval(function () {
            $scope.curDT = new Date();
            var futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 30);
            $scope.jobData.expires_on = futureDate.toISOString().slice(0, 10);
        }, 1000);

        // Fetch categories and set default category
        $http.get($rootScope.apiDomain + 'api/categories').then(function (response) {
            $scope.categories = response.data[0];
            // $scope.jobData.category = $scope.categories[0]; // Default to the first category
        });

        $scope.loadCategory = function (category = $scope.categories[0]) {
            if ($scope.showJobPostPage) {
                $scope.jobData.category = category;
                // $('#jobPostPage').modal('show');
            }
        };
        
        // Function to submit job data
        $scope.confirmPost = function () {
            // Ensure jobData is populated and log it to console
            // console.log($scope.jobData);

            // Send the jobData as JSON to the backend API
            $http({
                method: 'POST',
                url: $rootScope.apiDomain + 'api/jobs/post',
                data: $scope.jobData, // Send jobData directly
                headers: {
                    'Content-Type': 'application/json' // Set the Content-Type to JSON
                }
            }).then(function (response) {
                // Check if the response contains a success message
                if (response.data.success) {
                    // Success handling
                    $scope.jobData = {};
                    // console.log('Job posted successfully:', response.data);
                    $scope.token = response.data.token; // Save the token if needed
                    $scope.job_id = response.data.job_id; // You can also store the job ID if necessary
                    $rootScope.$broadcast('jobPosted');
                    $scope.toggleModal('jobPostOverlay'); // Hide job post overlay
                    $scope.toggleModal('editURL'); // Show success modal

                } else if (response.data.error) {
                    // Handle case where there is an error but still a 200 response
                    console.error('Error:', response.data.error);
                    alert('Error: ' + response.data.error);
                }
            }, function (error) {
                // Handle any HTTP errors (non-2xx responses)
                console.error('Error occurred:', error.data);
                alert('Error posting job. Please try again.');
            });
        };

        // Image preview function (if needed)
        $scope.SelectFile = function (e) {
            var reader = new FileReader();
            reader.onload = function (e) {
                $scope.PreviewImage = e.target.result;
                $scope.$apply();
            };
            reader.readAsDataURL(e.target.files[0]);
        };

    }]);

app.filter('emailAndLink', function () {
    return function (text) {
        if (!text) return text;

        // Regular expression to detect email addresses
        var emailPattern = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi;

        // Regular expression to detect URLs (starting with http/https or www)
        var urlPattern = /((http|https):\/\/[a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=.]+|www\.[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=.]+)/gi;

        // First, replace emails
        text = text.replace(emailPattern, '<a href="mailto:$1">$1</a>');

        // Then, replace URLs
        text = text.replace(urlPattern, function (match) {
            var url = match;
            // Add http:// if URL starts with www
            if (url.startsWith('www')) {
                url = 'http://' + url;
            }
            return '<a href="' + url + '" target="_blank">' + match + '</a>';
        });

        return text;
    };
});

app.run(function ($rootScope) {
    $rootScope.apiDomain = 'http://dev.jobeet_sm.com:8080/';
    $rootScope.websiteDomain = 'http://127.0.0.1:5500/#!/'
});

app.config(function ($routeProvider) {
    $routeProvider
        .when('/home', {
            templateUrl: 'views/homepage.html',
            controller: 'HomepageCtrl',
        })
        .when('/jobs/:category?', {
            templateUrl: 'views/jobs.html',
            controller: 'JobsCtrl'
        })
        .when('/post_job', {
            templateUrl: 'views/postJob.html',
            controller: 'PostJobCtrl'
        })
        .when('/post_job/edit/:token', {
            templateUrl: 'views/edit_job.html',
            controller: 'JobEditCtrl'
        })
        .when('/become_affiliate', {
            templateUrl: 'views/becomeAffiliate.html',
            controller: 'BecomeAffiliateCtrl'
        })
        .when('/news', {
            templateUrl: 'views/news.html',
            controller: 'NewsCtrl'
        })
        .when('/info', {
            templateUrl: 'views/info.html',
            controller: 'InfoCtrl'
        })
        .when('/job-details/:id', {
            templateUrl: 'views/jobDetails.html',
            controller: 'JobDetailsCtrl'
        })
        .otherwise({
            redirectTo: '/home'
        });
});

app.service('JobService', function ($http, $rootScope) {
    this.fetchJobs = function () {
        return $http({
            method: 'GET',
            url: $rootScope.apiDomain + 'api/jobs'
        });
    };
});

app.controller('HomepageCtrl', function ($scope, $http, $location, $rootScope) {
    $scope.title = 'Homepage Page';
    $scope.jobLocation = 'OnSite, Hybrid';
    $scope.jobTime = 'Full Time';
    $scope.companyName = 'Techtonic Solutions';
    $scope.jobDescription = 'Lorem ipsum, dolor sit amet consectetur adipisicing elit. Error vitae, tempore molestias tempora at veniam beatae odit ipsam eos et facere fugit placeat labore. Totam sint reiciendis unde adipisci natus?';

    $scope.jobSearch = '';  // Search input model
    $scope.suggestions = []; // Suggestions list

    // Fetch jobs data
    $http.get($rootScope.apiDomain + 'api/jobs').then(function (response) {
        $scope.jobs = response.data;
        $scope.activeJobs = $scope.jobs.filter(job => job.status === 'active');
    });

    // Function to filter jobs based on search query
    $scope.getSuggestions = function () {
        if ($scope.jobSearch) {
            $scope.suggestions = $scope.activeJobs.filter(job =>
                job.position.toLowerCase().includes($scope.jobSearch.toLowerCase()) ||
                job.company.toLowerCase().includes($scope.jobSearch.toLowerCase())
            ).slice(0, 5); // Limit to top 5 suggestions
        } else {
            $scope.suggestions = [];
        }
    };

    // Function to handle search submission
    $scope.submitSearch = function () {
        $location.path('/jobs').search({ query: $scope.jobSearch });
    };

    $scope.checkEnter = function (event) {
        if (event.which === 13) { // 13 is the Enter key
            $scope.submitSearch();
            event.preventDefault(); // Prevent the default form submission
        }
    };

    // Function to handle suggestion click
    $scope.openJobDetails = function (jobId) {
        $location.path('/job-details/' + jobId);
    };

    $http.get($rootScope.apiDomain + 'api/jobs').then(function (response) {
        $scope.jobs = response.data;

        // Filter active jobs
        $scope.activeJobs = $scope.jobs.filter(job => job.status === 'active');

        // Sort by 'created_on' in descending order without Z in the date
        $scope.activeJobs.sort((a, b) => new Date(b.created_on) - new Date(a.created_on));

        // Get top 10 newest jobs
        const topJobs = $scope.activeJobs.slice(0, 10);

        // Group jobs by category
        $scope.groupedJobs = topJobs.reduce((acc, job) => {
            if (!acc[job.category]) {
                acc[job.category] = [];
            }
            acc[job.category].push(job);
            return acc;
        }, {});

        // Count of jobs per category
        $scope.categoryCounts = Object.keys($scope.groupedJobs).map(category => ({
            name: category,
            count: $scope.groupedJobs[category].length
        }));
    });

    $scope.viewDetails = function (id) {
        $location.path('/job-details/' + id);
    };

    $scope.viewCategory = function (category) {
        $location.path('/jobs/' + category);
    };
});

app.controller('JobsCtrl', function ($scope, JobService, $location, $routeParams, $rootScope) {
    $scope.sortColumn = 'created_on';  // Default sort column
    $scope.reverseSort = true;         // Default sort order (newest first)
    $scope.categoryFilter = $routeParams.category || ''; // Get category from URL, default to empty
    $scope.jobSearch = $routeParams.query || '';

    $scope.jobsPerPage = 5;            // Jobs per page

    // Fetch jobs using the service
    $scope.fetchJobs = function () {
        JobService.fetchJobs().then(function (response) {
            $scope.jobs = [];
            $scope.categories = {};
            $scope.currentPage = {};
            $scope.totalPages = {};
            $scope.paginatedJobs = {};

            $scope.jobs = response.data;
            // Filter active jobs
            $scope.activeJobs = $scope.jobs.filter(job => job.status === 'active');

            // Sort active jobs by created_on (descending)
            $scope.activeJobs.sort((a, b) => new Date(b.created_on) - new Date(a.created_on));

            // Group jobs by category after sorting
            $scope.activeJobs.forEach(function (job) {
                if (!$scope.categories[job.category]) {
                    $scope.categories[job.category] = [];
                }
                $scope.categories[job.category].push(job);
            });

            // Initialize pagination for each category
            for (let category in $scope.categories) {
                $scope.currentPage[category] = 1; // Set initial page
                $scope.totalPages[category] = Math.ceil($scope.categories[category].length / $scope.jobsPerPage);
                updatePagination(category); // Set initial jobs for each category
            }
        }).catch(function (error) {
            console.error('Error fetching jobs:', error);
        });
    };

    // Initialize by fetching jobs
    $scope.fetchJobs();

    // Function to update the pagination based on current page
    // Update the pagination based on current page
    function updatePagination(category) {
        const filteredJobs = $scope.categories[category].filter(job => {
            const searchTerm = $scope.jobSearch.toLowerCase();
            return (
                job.position.toLowerCase().includes(searchTerm) ||
                job.company.toLowerCase().includes(searchTerm) ||
                job.location.toLowerCase().includes(searchTerm) ||
                job.category.toLowerCase().includes(searchTerm)
            );
        });

        const startIndex = ($scope.currentPage[category] - 1) * $scope.jobsPerPage;
        const endIndex = startIndex + $scope.jobsPerPage;

        $scope.paginatedJobs[category] = filteredJobs.slice(startIndex, endIndex);
        $scope.totalPages[category] = Math.ceil(filteredJobs.length / $scope.jobsPerPage);
    }

    // Reset pagination on search input change
    $scope.$watch('jobSearch', function () {
        for (let category in $scope.categories) {
            $scope.currentPage[category] = 1;
            updatePagination(category);
        }
    });

    // Function to navigate to the next page
    $scope.nextPage = function (category) {
        if ($scope.currentPage[category] < $scope.totalPages[category]) {
            $scope.currentPage[category]++;
            updatePagination(category); // Update jobs displayed based on new page
        }
    };

    // Function to navigate to the previous page
    $scope.prevPage = function (category) {
        if ($scope.currentPage[category] > 1) {
            $scope.currentPage[category]--;
            updatePagination(category); // Update jobs displayed based on new page
        }
    };

    // Custom filter function for searching
    $scope.customFilter = function (job, category) {
        const searchTerm = $scope.jobSearch.toLowerCase();
        // updatePagination(category);
        return (
            job.position.toLowerCase().includes(searchTerm) ||
            job.company.toLowerCase().includes(searchTerm) ||
            job.location.toLowerCase().includes(searchTerm) ||
            job.category.toLowerCase().includes(searchTerm)
        );
    };

    // Function to sort the table
    $scope.sort = function (column, isAscending) {
        $scope.sortColumn = column;           // Set the column to sort by
        $scope.reverseSort = !isAscending;    // Toggle sorting order

        // Sort jobs based on selected column
        if ($scope.sortColumn === 'created_on') {
            $scope.activeJobs.sort((a, b) => {
                return $scope.reverseSort ?
                    new Date(b.created_on) - new Date(a.created_on) :
                    new Date(a.created_on) - new Date(b.created_on);
            });
        } else {
            // Sort based on other columns like position, company, etc.
            $scope.activeJobs.sort((a, b) => {
                let valA = a[$scope.sortColumn].toLowerCase();
                let valB = b[$scope.sortColumn].toLowerCase();
                return $scope.reverseSort ? (valA < valB ? 1 : -1) : (valA > valB ? 1 : -1);
            });
        }

        // Update pagination after sorting
        for (let category in $scope.categories) {
            $scope.totalPages[category] = Math.ceil($scope.categories[category].length / $scope.jobsPerPage);
            updatePagination(category);
        }
    };

    // Navigate to the details page with selected job ID
    $scope.viewDetails = function (jobId) {
        $location.path('/job-details/' + jobId);
    };

    $scope.viewCategory = function (category, clearQuery) {
        if (clearQuery) {
            $location.path('/jobs/' + category).search({}); // This clears all query parameters
            $scope.jobSearch = '';
        } else {
            $location.path('/jobs/' + category); // Just change category
            $scope.jobSearch = '';
        }
    };

    $rootScope.$on('jobPosted', function () {
        // Only fetch jobs if you're on the jobs page
        if ($location.path() === '/jobs') {
            $scope.fetchJobs(); // Call the function to refresh the job list
        }
    });

    // Function to check if a category filter is applied
    $scope.isFilteredByCategory = function (category) {
        return $scope.categoryFilter === '' || $scope.categoryFilter === category;
    };
});


app.controller('JobDetailsCtrl', function ($scope, $routeParams, $http, $rootScope) {
    const jobID = $routeParams.id;

    // Directly request the specific job by ID
    $http.get($rootScope.apiDomain + `api/jobs/${jobID}`)
        .then(function (response) {
            $scope.job = response.data.data; // Assuming the API returns the job object directly
        }, function (error) {
            console.error("Error fetching job data:", error);
            $scope.errorMessage = "Unable to retrieve job data.";
        });
});

app.controller('PostJobCtrl', function ($scope, $interval, $http, $rootScope) {
    $scope.title = 'Post Job';
    $scope.jobData = {}; // Initialize jobData object
    $scope.jobData.type = 'Full-Time'; // Set a default value for the job type

    // Set a future expiry date dynamically
    $interval(function () {
        $scope.curDT = new Date();
        var futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 30);
        $scope.jobData.expires_on = futureDate.toISOString().slice(0, 10);
    }, 1000);

    // Fetch categories and set default category
    $http.get($rootScope.apiDomain + 'api/categories').then(function (response) {
        $scope.categories = response.data[0];
        // $scope.jobData.category = $scope.categories[0]; // Default to the first category
    });

    $scope.openJobPostPage = function (category = $scope.categories[0]) {
        if (!$('#jobPostPage').hasClass('show')) {
            $scope.jobData.category = category;
            $('#jobPostPage').modal('show');
        }
    };
    // Function to open the overlay
    $scope.openOverlay = function () {
        if (!$('#jobPostOverlay').hasClass('show')) {
            $('#jobPostOverlay').modal('show');
        }
    };

    // Function to close the overlay
    $scope.closeOverlay = function (modalId) {
        $(modalId).modal('hide');
    };

    // Function to submit job data
    $scope.confirmPost = function () {

        // Send the jobData as JSON to the backend API
        $http({
            method: 'POST',
            url: $rootScope.apiDomain + 'api/jobs/post',
            data: $scope.jobData, // Send jobData directly
            headers: {
                'Content-Type': 'application/json' // Set the Content-Type to JSON
            }
        }).then(function (response) {
            // Check if the response contains a success message
            if (response.data.success) {
                // Success handling
                $scope.jobData = {};
                $scope.token = response.data.token; // Save the token if needed
                $scope.job_id = response.data.job_id; // You can also store the job ID if necessary
                $('#editURL').modal('show'); // Show success modal
                $rootScope.$broadcast('jobPosted');
                $('#jobPostOverlay').modal('hide'); // Hide job post overlay
                $('#jobPostPage').modal('hide'); // Hide job post overlay
            } else if (response.data.error) {
                // Handle case where there is an error but still a 200 response
                console.error('Error:', response.data.error);
                alert('Error: ' + response.data.error);
            }
        }, function (error) {
            // Handle any HTTP errors (non-2xx responses)
            console.error('Error occurred:', error.data);
            alert('Error posting job. Please try again.');
        });
    };

    // Image preview function (if needed)
    $scope.SelectFile = function (e) {
        var reader = new FileReader();
        reader.onload = function (e) {
            $scope.PreviewImage = e.target.result;
            $scope.$apply();
        };
        reader.readAsDataURL(e.target.files[0]);
    };
});


app.controller('JobEditCtrl', function ($scope, $routeParams, $http, $location) {
    $scope.title = "Poster Job Edit";
    const token = $routeParams.token;

    $http.get('categories.json').then(function (response) {
        $scope.categories = response.data.categories;
    });

    $http.get('job_data.json').then(function (response) {
        const job = response.data.find(job => job.token === token);
        if (job) {
            $scope.position = job.position;
            $scope.company = job.company;
            $scope.type = job.type;
            $scope.url = job.url;
            $scope.location = job.location;
            $scope.description = job.description;
            $scope.how_to_apply = job.how_to_apply;
            $scope.email = job.email;
            $scope.expires = new Date(job.expires_at);
            $scope.created = job.created_on;
            $scope.category = job.category;
            $scope.is_public = job.public;

            $scope.currentDate = new Date();
            const timeDiff = new Date(job.expires_at) - new Date();
            const daysUntilExpiry = Math.floor(timeDiff / (1000 * 3600 * 24));

            $scope.canExtend = daysUntilExpiry <= 5 && daysUntilExpiry >= 0;

            $scope.extendValidity = function () {
                $scope.expires.setDate($scope.expires.getDate() + 30);
                const newExpiryDateFormatted = $scope.expires.toDateString() + ' ' + $scope.expires.toLocaleTimeString();
                console.log($scope.expires);
                $scope.canExtend = false;
                alert("Job Validity Extended. New expiry date is " + newExpiryDateFormatted);
            };
        } else {
            alert('Job not found. Please check the token.');
            $location.path('/');
        }
    });
});

app.controller('BecomeAffiliateCtrl', function ($scope) {
    $scope.title = 'Become an Affliate';
});

app.controller('NewsCtrl', function ($scope) {
    $scope.title = "News Section"
});

app.controller('InfoCtrl', function ($scope, $timeout, $window) {
    $scope.title = 'Info Page';
    $scope.countProfessionals = 0;
    $scope.countCompanies = 0;
    $scope.countOffers = 0;
    $scope.countVisits = 0;
    $scope.countUsers = 0;

    var targetCounts = {
        countProfessionals: 6800,
        countCompanies: 2100,
        countOffers: 9200,
        countVisits: 300000,
        countUsers: 230000
    };

    //function to increment counts
    function countUp(start, target, field) {
        if (start < target) {
            var increment = Math.ceil((target - start) / 20);
            $scope[field] = start + increment;
            $timeout(function () {
                countUp($scope[field], target, field);
            }, 50)
        } else {
            $scope[field] = target;
        }
    }

    angular.element($window).on('scroll', function () {
        var statsSection = document.getElementById('stats');
        if (statsSection) {
            var position = statsSection.getBoundingClientRect().top;
            var windowHeight = window.innerHeight;

            if (position < windowHeight - 100) {
                countUp($scope.countProfessionals, targetCounts.countProfessionals, 'countProfessionals');
                countUp($scope.countCompanies, targetCounts.countCompanies, 'countCompanies');
                countUp($scope.countOffers, targetCounts.countOffers, 'countOffers');
                countUp($scope.countVisits, targetCounts.countVisits, 'countVisits');
                countUp($scope.countUsers, targetCounts.countUsers, 'countUsers');
                $scope.$apply();
            }
        }
    });
});
