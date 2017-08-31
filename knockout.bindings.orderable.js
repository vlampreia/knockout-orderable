ko.bindingHandlers.orderable = {
    getProperty: function(o, s) {
        // copied from http://stackoverflow.com/questions/6491463/accessing-nested-javascript-objects-with-string-key
        s = s.replace(/\[(\w+)\]/g, '.$1'); // convert indexes to properties
        s = s.replace(/^\./, '');           // strip a leading dot
        var a = s.split('.');
        while (a.length) {
            var n = a.shift();
            if (n in o) {
                o = o[n];
            } else {
                return;
            }
        }
        return o;
    },

    compare: function (left, right) {
        if (typeof left === 'string' || typeof right === 'string') {
            return left ? left.localeCompare(right) : 1;
        }
        if (left > right)
            return 1;

        return left < right ? -1 : 0;
    },

    sort: function (viewModel, collection, field, compare) {
        //make sure we sort only once and not for every binding set on table header
        if (collection.orderField() == field) {
            collection.sort(function (left, right) {
                var left_field = ko.bindingHandlers.orderable.getProperty(left, field);
                var right_field = ko.bindingHandlers.orderable.getProperty(right, field);
                var left_val  = (typeof  left_field === 'function') ?  left_field() :  left_field;
                    right_val = (typeof right_field === 'function') ? right_field() : right_field;
                if (collection.orderDirection() == "desc") {
                    if (compare !== undefined) {
                        return compare(right_val, left_val);
                    }
                    return ko.bindingHandlers.orderable.compare(right_val, left_val);
                } else {
                    if (compare !== undefined) {
                        return compare(left_val, right_val);
                    }
                    return ko.bindingHandlers.orderable.compare(left_val, right_val);
                }
            });
        }
    },

    init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        //get provided options
        var collection = valueAccessor().collection;
        if (typeof collection === 'string') collection = viewModel[collection];
        var field = valueAccessor().field;
        var comparator = valueAccessor().comparator;

        if (comparator !== undefined && typeof comparator !== 'function') {
            throw new Error('The comparator binding must be a function');
        }

        //add a few observables to ViewModel to track order field and direction
        if (collection.orderField == undefined) {
            collection.orderField = ko.observable();
        }
        if (collection.orderDirection == undefined) {
            collection.orderDirection = ko.observable("asc");
        }

        var defaultField = valueAccessor().defaultField;
        var defaultDirection = valueAccessor().defaultDirection || "asc";
        if (defaultField) {
            collection.orderField(field);
            collection.orderDirection(defaultDirection);
            ko.bindingHandlers.orderable.sort(viewModel, collection, field, comparator);
        }

        //set order observables on table header click
        $(element).click(function (e) {
            e.preventDefault();
            
            //flip sort direction if current sort field is clicked again
            if (collection.orderField() == field) {
                if (collection.orderDirection() == "asc") {
                    collection.orderDirection("desc");
                } else {
                    collection.orderDirection("asc");
                }
            }
            
            collection.orderField(field);
        });

        //order records when observables changes, so ordering can be changed programmatically
        collection.orderField.subscribe(function () {
            ko.bindingHandlers.orderable.sort(viewModel, collection, field, comparator);
        });
        collection.orderDirection.subscribe(function () {
            ko.bindingHandlers.orderable.sort(viewModel, collection, field, comparator);
        });
    },

    update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        //get provided options
        var collection = valueAccessor().collection;
        if (typeof collection === 'string') collection = viewModel[collection];
        var field = valueAccessor().field;
        var isOrderedByThisField = collection.orderField() == field;
            
        //apply css binding programmatically
        ko.bindingHandlers.css.update(
            element,
            function () {
                return {
                    sorted: isOrderedByThisField,
                    asc: isOrderedByThisField && collection.orderDirection() == "asc",
                    desc: isOrderedByThisField && collection.orderDirection() == "desc"
                };
            },
            allBindingsAccessor,
            viewModel,
            bindingContext
        );
    }
};
