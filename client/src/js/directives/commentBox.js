angular.module('gokibitz.directives')
/**
 * Provides Facebook-style keyboard shortcuts for comment boxes.
 * Enter to submit, shift + enter for a regular carriage return,
 * and escape to cancel.
 */
.directive('gkCommentBox', function ($http, $q, $document, pathFilter, Comment) {
	return {
		restrict: 'A',
		require: '?ngModel',
		link: function ($scope, element, attributes, ngModel) {
			var text = element.val();
			var canceler;

			// Check if the element currently has focus
			var hasFocus = function () {
				return $document[0].activeElement === element[0];
			};

			// Get a preview of rendered HTML from comment markdown
			function preview() {
				if (element.val() !== text) {

					// Cancel any previous markdown calls
					if (canceler) {
						canceler.resolve();
					}

					text = element.val();

					// Create a deferred with which to timeout the call,
					// if need be (for instance, if the comment is submitted
					// before the preview comes back)
					canceler = $q.defer();

					// Get an HTML preview of the markdown
					$http.post('/api/markdown/', {
						markdown: element.val()
					}, {
						timeout: canceler.promise
					})
						.success(function (data) {
							$scope.commentPreview = data.markup;
						});
				}
			}

			// Prevent changes in the model that happen elsewhere (ie, a regularly
			// polling update) from updating more than the initial value of the
			// comment box
			if (attributes.gkCommentOneway) {
				ngModel.$render = function () {
					if (!hasFocus()) {
						element.val(ngModel.$viewValue);
					} else {
						ngModel.$setViewValue(element.val());
					}
				};
			}

			// Watch the value of the comment and fetch a preview when it changes
			$scope.$watch('formData.content', function (newValue, oldValue) {
				// @see http://stackoverflow.com/a/18915585/399077
				if (newValue !== oldValue) {
					preview();
				}
			});

			$scope.cancelComment = function () {
				$scope.formData = '';
				$scope.commentPreview = '';
			};

			$scope.addComment = function () {
				$scope.disableAddComment = true;
				
				var data = $scope.formData;
				data._id = $scope.kifu._id;
				data.path = pathFilter($scope.kifu.path, 'string');
				
				var newComment = new Comment(data);
				newComment.$save(function (response) {
					$scope.disableAddComment = false;
					$scope.formData = {};
					$scope.listComments(true);
				});
			};


			// Check for enter on keypress, so we can prevent its default action
			element.bind('keypress', function (event) {
				var key = event.keyCode || event.which;
				if (key === 13 && !event.shiftKey) {
					event.preventDefault();

					// Cancel any outstanding preview calls
					if (canceler) {
						canceler.resolve();
					}

					$scope.addComment();
					$scope.commentPreview = '';
				}
			});

			// Escape only registers on keyup
			element.bind('keyup', function (event) {
				var key = event.keyCode || event.which;
				// Escape cancels
				if (key === 27) {
					$scope.$apply('cancelComment()');
				}
			});
		}
	};
});
