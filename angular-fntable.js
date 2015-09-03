var fnTable = angular.module('fnTable', []);

// Helpers
fnTable
.filter('fnTableSlice', function () {
  return function (array, start, end) {
    return array ? array.slice(start, end) : [];
  }
})
.filter('fnTableRange', function () {
  return function (n) {
    return new Array(n || 0);
  }
})
.filter('fnTableOrder', function ($filter) {
  return function (array, order, sort) {
    return $filter(order)(array, sort);
  }
})
.directive('fnTableRepeat', function ($window, $timeout) {
  var shouldFixColumns = true;

  var fixColumnWidths = function(scope, elem) {
    elem = elem.parent().parent(); // tr -> tbody -> table
    var totalWidth = $window.getComputedStyle(elem[0]).getPropertyValue('width').replace('px', '');
    var headers = elem.find('th');
    var totalHeaderSizes = 0;

    for (var i = 0; i < headers.length; i++) {
      var header = headers[i];
      var headerSize = ($window.getComputedStyle(header).getPropertyValue('width').replace('px', '') / totalWidth) * 100;
      totalHeaderSizes += headerSize;

      if (i + 1 === headers.length) {
        var gap = 100 - totalHeaderSizes;
        headerSize += gap;
      }

      header.style.width = headerSize + '%';
    }
  }

  return function (scope, elem, attr) {
    // Run once
    if (!shouldFixColumns || !scope.$last) {
      return;
    }
    shouldFixColumns = false;

    $timeout(function () {
      fixColumnWidths(scope, elem);
    });
  }
});

// Default table configuration
fnTable
.factory('fnTableConfig', function () {
  return {
    sort: [],
    order: 'orderBy',
    numItemsPerPage: 10,

    sortIconClass: null,
    sortIconClassNone: null,
    sortIconClassAsc: null,
    sortIconClassDesc: null
  };
});

// Implementation
fnTable
.directive('fnTable', function ($window, $timeout, fnTableConfig) {
  var ignoreAttributes = ['fn-table-header', 'fn-table-sort'];

  var getConfig = function(attr) {
    var config = {
      sortIconClass: attr.sortIconClass || fnTableConfig.sortIconClass,
      sortIconClassNone: attr.sortIconClassNone || fnTableConfig.sortIconClassNone,
      sortIconClassAsc: attr.sortIconClassAsc || fnTableConfig.sortIconClassAsc,
      sortIconClassDesc: attr.sortIconClassDesc || fnTableConfig.sortIconClassDesc
    };

    return config;
  }

  var createTableHTML = function(elem, attr) {
    var config = getConfig(attr);

    var html = '';
    var columns = elem.find('td');

    // Table header
    html += '<thead>';
    html += '<tr>';
    for (var i = 0; i < columns.length; i++) {
      var column = columns[i];
      var isSortable = column.hasAttribute('fn-table-sort');

      html += '<th ';
      if (isSortable) {
        var sortBy = column.getAttribute('fn-table-sort');
        html += 'class="fn-table-sortable" ';
        html += 'ng-class="{ ';
        html += '\'fn-table-sort-none\': !sortState[\'' + sortBy + '\'], ';
        html += '\'fn-table-sort-asc\': sortState[\'' + sortBy + '\'] === \'asc\', ';
        html += '\'fn-table-sort-desc\': sortState[\'' + sortBy + '\'] === \'desc\' ';
        html += '}" ';
        html += 'ng-click="toggleSort(\'' + sortBy + '\')"';
      }
      html += '>' + (column.hasAttribute('fn-table-header') ? column.getAttribute('fn-table-header') : '&nbsp;');

      if (isSortable) {
        html += '<span ';
        if (config.sortIconClass) {
          html += 'class="' + config.sortIconClass + '" ';
        }
        if (config.sortIconClassNone || config.sortIconClassAsc || config.sortIconClassDesc) {
          html += 'ng-class="{ ';
          if (config.sortIconClassNone) {
            html += '\'' + config.sortIconClassNone + '\': !sortState[\'' + sortBy + '\'], ';
          }
          if (config.sortIconClassAsc) {
            html += '\'' + config.sortIconClassAsc + '\': sortState[\'' + sortBy + '\'] === \'asc\', ';
          }
          if (config.sortIconClassDesc) {
            html += '\'' + config.sortIconClassDesc + '\': sortState[\'' + sortBy + '\'] === \'desc\' ';
          }
          html += '}" ';
        }
        html += '></span>';
      }

      html += '</th>';
    }
    html += '</tr>';
    html += '</thead>';

    // Table body
    html += '<tr ng-repeat="item in filtered = (items | filter:state.filter | fnTableOrder:state.order:state.sort) | fnTableSlice:state.startOffset:state.endOffset" fn-table-repeat fn-table-state="state">';
    for (var i = 0; i < columns.length; i++) {
      var column = columns[i];
      html += '<td ';
      for (var j = 0; j < column.attributes.length; j++) {
        var attr = column.attributes[j];
        if (ignoreAttributes.indexOf(attr.name) !== -1) {
          continue;
        }
        html += attr.name + '=' + '"' + attr.value + '"';
      }
      html += '>' + column.innerHTML + '</td>';
    }
    html += '</tr>';
    // Fill gap
    html += '<tr ng-repeat="row in state.gap | fnTableRange track by $index">';
    for (var i = 0; i < columns.length; i++) {
      html += '<td>&nbsp;</td>';
    }
    html += '</tr>';
    html += '</tbody>';
    
    return html;
  }

  var toggleSort = function(sortColumns, sortBy) {
    var idx = -1;
    var sign;
    for (var i = 0; i < sortColumns.length; i++) {
      var field = sortColumns[i];
      if (field[0] === '+') {
        sign = '-';
      } else if (field[0] === '-') {
        sign = '+';
      } else {
        sign = null;
      }
      if (sign) {
        field = field.substring(1);
      }

      if (field === sortBy) {
        idx = i;
        break;
      }
    }
    sortBy = (sign || '+') + sortBy;

    if (idx !== -1) {
      sortColumns.splice(idx, 1);
    }
    sortColumns.unshift(sortBy);

    return sortColumns;
  }

  var updateSortState = function(sortColumns, sortState) {
    sortColumns.forEach(function (sortBy) {
      var state;
      if (sortBy[0] === '+') {
        state = 'asc';
      } else if (sortBy[0] === '-') {
        state = 'desc';
      } else {
        state = null;
      }
      if (state) {
        sortBy = sortBy.substring(1);
      }
      sortState[sortBy] = state;
    });
  }

  return {
    scope: {
      items: '=fnTableItems',
      state: '=fnTableState'
    },

    compile: function (elem, attr) {
      return {
        post: function (scope, elem, attr) {
          scope.items = [];
          scope.state = scope.state || {};

          // Default values
          scope.state.sort = scope.state.sort || fnTableConfig.sort;
          scope.state.order = scope.state.order || fnTableConfig.order;
          scope.state.currentPage = scope.state.currentPage || 1;
          scope.state.numItemsPerPage = '' + (scope.state.numItemsPerPage || fnTableConfig.numItemsPerPage);

          scope.sortState = {};
          updateSortState(scope.state.sort, scope.sortState);

          scope.toggleSort = function(sortBy) {
            toggleSort(scope.state.sort, sortBy);
            updateSortState(scope.state.sort, scope.sortState);
          }

          scope.update = function() {
            scope.state.numItems = scope.items.length;
            scope.state.numFilteredItems = scope.filtered.length;

            var all = (scope.state.numItemsPerPage == -1);
            scope.state.numPages = all ? 1 : Math.ceil(scope.state.numFilteredItems / scope.state.numItemsPerPage);

            scope.state.startOffset = (scope.state.currentPage - 1) * scope.state.numItemsPerPage;
            scope.state.numDisplyedItems = Math.min(scope.state.numItemsPerPage, scope.state.numFilteredItems - scope.state.startOffset);
            scope.state.endOffset = scope.state.startOffset + scope.state.numDisplyedItems;

            scope.state.gap = all ? 0 : ((scope.state.numDisplyedItems < scope.state.numItemsPerPage) ? (scope.state.numItemsPerPage - scope.state.numDisplyedItems) : 0);
          }

          // Watchers
          scope.$watch('items', function() {
            scope.update();
          }, true);

          scope.$watch('state.filter', function (newFilter, oldFilter) {
            scope.update();
          });

          scope.$watch('state.currentPage', function() {
            scope.update();
          });

          scope.$watch('state.numItemsPerPage', function (newFilter, oldFilter, scope) {
            scope.update();
          });
        }
      }
    },

    template: function (elem, attr) {
      return createTableHTML(elem, attr);
    }
  };
})
.directive('fnTablePagination', function () {
  var defaultHTML = function() {
    var html = '';

    // Previous page
    html += '<span ng-if="state.currentPage === 1">&lt;</span>';
    html += '<a href="#" ng-if="state.currentPage > 1" ng-click="state.currentPage = state.currentPage - 1">&lt;</a>';
    html += '&nbsp;';

    // Available pages
    html += '<div style="display: inline-block;" ng-repeat="page in state.numPages | fnTableRange track by $index">';
    html += '<a href="#" ng-if="state.currentPage != ($index + 1)" ng-click="state.currentPage = $index + 1">{{ $index + 1 }}</a>';
    html += '<span ng-if="state.currentPage === ($index + 1)">{{ $index + 1 }}</span>';
    html += '&nbsp;';
    html += '</div>';

    // Next page
    html += '<span ng-if="state.currentPage === state.numPages">&gt;</span>';
    html += '<a href="#" ng-if="state.currentPage < state.numPages" ng-click="state.currentPage = state.currentPage + 1">&gt;</a>';

    return html;
  }

  return {
    scope: {
      state: '=fnTableState'
    },

    template: function (elem, attr) {
      return defaultHTML();
    }
  };
})
.directive('fnTablePageSize', function () {
  var defaultPresets = [10, 25, 50, 100, -1];

  var defaultHTML = function(presets) {
    var html = '<select ng-model="state.numItemsPerPage">';
    presets.forEach(function (preset) {
      var value = preset.value ? preset.value : preset;
      var label = preset.label ? preset.label : (value === -1 ? '-' : value);
      html += '<option value="' + value + '">' + label + '</option>';
    });
    html += '</select>';
    return html;
  }

  return {
    scope: {
      state: '=fnTableState'
    },

    template: function (elem, attr) {
      return defaultHTML(defaultPresets);
    }
  };
});