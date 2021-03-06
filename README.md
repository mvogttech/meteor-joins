Adaptation of Meteor Joins by @perak
===================================

Q: Why?

A: The original version of the package restricted the developer to only query documents within joining collections by the document's `_id`. With this package you can define which property you would like to query for within the joined collection.

Example 1 - simple join
-----------------------

We have two collections: Companies & Employees

```
var Companies = new Mongo.Collection("companies");
var Employees = new Mongo.Collection("employees");
```

Example **company** document:

```
{
	_id: "CQKDzmqmQXGhsC6PG",
	name: "Acme"
}
```

Example **employee** document:

```
{
	_id: "dySSKA25pCtKjo5uA",
	name: "Jimi Hendrix",
	companyId: "CQKDzmqmQXGhsC6PG"
}
```

Let's **define join** (in both server & client scope)

```
Employees.join(Companies, "companyId", "company", ["name"], "CompaniesFieldKey(Optional)");
```

*Or you can pass collection name:*

```
Employees.join("Companies", "companyId", "company", ["name"]);
```

And at server in publication, instead simply returning cursor, return with Collection.publishJoinedCursors method:

```
Meteor.publish("employees", function() {

	var cursor = Employees.find(); // do what you normally do here

	return Employees.publishJoinedCursors(cursor); // instead of simply returning resulting cursor
});
```

Now, if you do:

```
Employees.find();
```

You'l get:

```
{
	_id: "dySSKA25pCtKjo5uA",
	name: "Jimi Hendrix",
	companyId: "CQKDzmqmQXGhsC6PG",
	company: {
		name: "Acme"
	}
}
```

Join will be reactive if you pass `reactive: true` as option to publishJoinedCursors and publication context as last argument:

```
Meteor.publish("employees", function() {

	var cursor = Employees.find();

	return Employees.publishJoinedCursors(cursor, { reactive: true }, this);

});
```
Example 2 - simple join with defined property
------------------------


Example 3 - generic join
------------------------

Let's say we have four collections:

```
var Companies = new Mongo.Collection("companies");
var Employees = new Mongo.Collection("employees");
var Tags = new Mongo.Collection("tags");
var TaggedDocuments = new Mongo.Collection("tagged_documents");
```

in "Tags" collection we have list of possible tags:

```
{
	_id: "wrWrXDqWwPrXCWsgu",
	name: "Awesome!"
}
```

We can tag documents from both "Companies" and "Employees". When document is tagged we are storing three values into "TaggedDocuments" collection:

```
{
	tagId: "wrWrXDqWwPrXCWsgu",
	collectionName: "Employees",
	docId: "dySSKA25pCtKjo5uA"
},
{
	tagId: "wrWrXDqWwPrXCWsgu",
	collectionName: "Companies",
	docId: "CQKDzmqmQXGhsC6PG"
}
```

- `tagId` stores tag id from "Tags" collection
- `collectionName` stores name of collection where tagged document belongs to
- `docId` stores id of tagged document

**collectionName** can be any existing collection.

Let's define generic join:

```
TaggedDocuments.genericJoin("collectionName", "docId", "document");
```

Now, if you do:

```
TaggedDocuments.find({ tagId: "wrWrXDqWwPrXCWsgu" });
```

You'l get something like this:

```
{
	tagId: "wrWrXDqWwPrXCWsgu",
	collectionName: "Employees",
	docId: "dySSKA25pCtKjo5uA",
	document: {
		name: "Jimi Hendrix",
		companyId: "CQKDzmqmQXGhsC6PG"
	}
},
{
	tagId: "wrWrXDqWwPrXCWsgu",
	collectionName: "Companies",
	docId: "CQKDzmqmQXGhsC6PG",
	document: {
		name: "Acme"
	}
}
```

Also, you can define simple join to "Tags" collection too:

```
TaggedDocuments.join(Tags, "tagId", "tag", []);
TaggedDocuments.genericJoin("collectionName", "docId", "document");
```

And now if you do:

```
TaggedDocuments.find({ tagId: "wrWrXDqWwPrXCWsgu" });
```

You'l get:

```
{
	tagId: "wrWrXDqWwPrXCWsgu",
	tag: {
		name: "Awesome!"
	},
	collectionName: "Employees",
	docId: "dySSKA25pCtKjo5uA",
	document: {
		name: "Jimi Hendrix",
		companyId: "CQKDzmqmQXGhsC6PG"
	}
},
{
	tagId: "wrWrXDqWwPrXCWsgu",
	tag: {
		name: "Awesome!"
	},
	collectionName: "Companies",
	docId: "CQKDzmqmQXGhsC6PG",
	document: {
		name: "Acme"
	}
}
```

voilà - we have generic N:M join!


Function reference
==================

Collection.join
---------------

`Collection.join(collection, foreignKey, containerField, fieldList, fieldKey)`

### Arguments:

- `collection` Mongo.Collection object (or collection name) to join
- `foreignKey` field name where foreign document _id is stored (in our example: `"companyId"`)
- `containerField` field name where to store foreign document (in our example: `"company"`)
- `fieldList` array of field names we want to get from foreign collection (in our example array with one field `["name"]`)
- `fieldKey` (optional) field name to use as identification key for foreign document

Use this function in scope visible both to client and server.


Collection.genericJoin
----------------------

`Collection.genericJoin(collectionNameField, foreignKey, containerField)`

- `collectionNameField` field name (from this collection) in which foreign collection name is stored
- `foreignKey` field name where foreign document _id is stored
- `containerField` field name where to store joined foreign document


Collection.publishJoinedCursors
-------------------------------

For use server side in publications: instead of simply returning result from collection, we want to return cursors with data from joined collections too.
This function will query joined collections and will return array of cursors.

`Collection.publishJoinedCursors(cursor, options, publicationContext)`

### Arguments

- `cursor` cursor that you normally return from publish function
- `options` options object, currently only one option exists: `{ reactive: true }`
- `publicationContext` publish's `this` (only if you want it reactive)

Example **publish** function:

```
Meteor.publish("employees", function() {

	var cursor = Employees.find(); // do what you normally do here

	return Employees.publishJoinedCursors(cursor); // instead of simply returning resulting cursor
});
```
With queried employees, cursor with companies filtered by employee.companyId will be returned too.

If you want it reactive:

```
Meteor.publish("employees", function() {

	var cursor = Employees.find(); // do what you normally do here

	return Employees.publishJoinedCursors(cursor, { reactive: true }, this);
});
```


Using `reactive: true` and `auditargument-checks` package
---------------------------------------------------------

Your publication will be called with one extra argument (internally used by package). That's OK unless you are using `audit-argument-checks` which forces you to `check()` all arguments passed to publication. In that case, you need to check that extra argument:

```
Meteor.publish("publicationName", function(arg1, extraArgument) {
	check(arg1, ...); // check your arguments as you normally do ...
	check(extraArgument, Match.Any); // ... but don't forget to check extraArgument
});

```

