# fnTable

Table directives for Angular. Pronounced "effin-table."

### Features

  * Supposedly simple to use and contribute to
  * Pagination
  * Sort by multiple columns
  * Pluggable order, in case you want to use [locale-aware orderBy](https://github.com/elad/angular-orderByLocaleAware)
  * Visually appealing - constant column widths, fills last page of table if needed
  * Easy to style - makes no styling decisions
  * Direction agnostic - works with both left-to-right and right-to-left layouts

### Inspiration and better alternatives

  * [samu/angular-table](https://github.com/samu/angular-table)
  * [davidjnelson/angular-table](https://github.com/davidjnelson/angular-table)
  * [ngTable](https://github.com/esvit/ng-table)
  
## Install

```
$ bower install angular-fntable
```

## Use

Include it in your project:

```html
<script src="bower_components/angular-fnTable/angular-fnTable.js"></script>
```

Add a dependency:

```js
var myApp = angular.module('myApp', ['fnTable']);
```

### Basic

Use the **`fn-table`** attribute, point to data using **`fn-table-data`**, and set header titles using **`fn-table-header`**:

```html
<table fn-table fn-table-data="items">
  <td fn-table-header="Name">{{ item.name }}</td>
  <td fn-table-header="Age">{{ item.age }}</td>
</table>
```

Given **`items`** is a scope variable that looks like:

```js
$scope.items = [
  { name: 'Alice', age: 30 },
  { name: 'Bob', age: 35 }
];
```

### Sorting

Use **`fn-table-sort`** to point to the attribute name to use when sorting by this column, optionally setting ascending and descending properties with **`+`** and **`-`**:

```html
<table fn-table fn-table-data="items">
  <td fn-table-header="Name" fn-table-sort="+name">{{ item.name }}</td>
  <td fn-table-header="Age" fn-table-sort="-name">{{ item.age }}</td>
</table>
```

Clicking the header will toggle sorting by it between ascending and descending.

Sorting is done on multiple columns.

### Sort icons

There are four attributes you can set on a `table` with `fn-table` to control sort icons:

  * **`fn-table-sort-icon-class`**, the base class for all sort icons
  * **`fn-table-sort-icon-class-none`**, the class to use when the column is sortable but not sorted
  * **`fn-table-sort-icon-class-asc`** for ascending sort
  * **`fn-table-sort-icon-class-desc`** for descending sort

### Shared state

A shared state is used to allow external controls for the table such as a **filter** and **pagination** and lets the table expose information about its current state, like the **number of items** and the **current page**.

A shared state is just a scope variable:

```js
$scope.state = {
  // see below
};
```

Use **`fn-table-state`** to pass the state to directives:

```html
<table fn-table fn-table-data="items" fn-table-state="state">
  <td fn-table-header="Name">{{ item.name }}</td>
  <td fn-table-header="Age">{{ item.age }}</td>
</table>
```

### Filtering

A **filter** is a state variable:

```js
$scope.state = {
  filter: ''
};
```

The rest is simple use of **`ng-model`**:

```html
<input type="text" ng-model="state.filter" />
```

If you want to debounce filter changes, consider using something like ```ng-model-options="{ debounce: 50 }"```.

### Pagination

**Pagination** is controlled by state variables:

```js
$scope.state = {
  numItemsPerPage: 10 // Use -1 for "all items"
};
```

There are a few more state variables you should know:

```html
Total number of items:  {{ state.numItems }
Number of filtered items: {{ state.numFilteredItems }}

Number of items per page: {{ state.numItemsPerPage }}
Number of pages: {{ state.numPages }}
Current page: {{ state.currentPage }}
Items on this page: {{ state.numDisplayedItems }}
```

You can use them with **`ng-model`**:

```html
<a href="#" ng-click="state.currentPage = state.currentPage - 1">Previous page</a>
<a href="#" ng-click="state.currentPage = state.currentPage + 1">Next page</a>
```

#### Component

If you're lazy, there are two pagination components, **`fn-table-pagination`** and **`fn-table-page-size`**:

```html
<span fn-table-pagination fn-table-state="state"></span>

<span fn-table-page-size fn-table-state="state"></span>
```

### Global configuration

You can use `fnTableConfig` to set global defaults. This is especially useful for things like sort icons:

```js
myApp
.run(function (fnTableConfig) {
  fnTableConfig.sortIconClass = 'pull-right fa';
  fnTableConfig.sortIconClassNone = 'fa-sort';
  fnTableConfig.sortIconClassAsc = 'fa-sort-asc';
  fnTableConfig.sortIconClassDesc = 'fa-sort-desc';
});
```

### Classes

The module sets the following classes:

  * **`fn-table-sortable`** is set sortable `th` elements
  * **`fn-table-sort-none`**, **`fn-table-sort-asc`**, and **`fn-table-sort-desc`** are set on sortable `th` elements appropriately

## Contributing

This project follows the ["OPEN Open Source"](https://gist.github.com/substack/e205f5389890a1425233) philosophy. If you submit a pull request and it gets merged you will most likely be given commit access to this repository.

## License

ISC.
