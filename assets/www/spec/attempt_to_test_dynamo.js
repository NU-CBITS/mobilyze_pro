/*
 * Factories
 * ---------
 * A chai factory defines a way of creating a mock object
 * a simple example would be:
 * chai.factory('person', { name: 'John Doe', age: 29 });
 * then when you define
 * var person = chai.factory('person')
 * person will equal the object defined by the factory
 * full docs at https://github.com/chaijs/chai-factories 
 */


/*
 * Test Stubs 
 * -----
 * Test stubs are functions with pre-programmed behavior.
 * They can stand alone or can wrap an existing function.
 * They are a part of sinon.js and are useful for when you want to (from the readme):
 * 1) Control a method's behavior from a test to force the code down a specific path. 
 *		Examples include forcing a method to throw an error in order to test error handling.
 * 2) When you want to prevent a specific method from being called directly 
 *		(possibly because it triggers undesired behavior, such as a XMLHttpRequest or similar).
 * To define a stub that is it's own standalone function:
 * 	var stub = sinon.stub();
 * To replace a function (Not sure how this case is useful):
 * 	var stub = sinon.stub(object, "method");
 * To replace a function, specifying what to replace it with:
 *	var stub = sinon.stub(object, "method", func);
 * Even more specific, to stub a method only for certain arguments:
 *	var callback = sinon.stub();
 *	callback.withArgs(42).returns(1);
 *	callback.withArgs(1).throws("TypeError");
 * More general, to stub all the methods of an object:
 *	var stub = sinon.stub(obj);

 * full docs at http://sinonjs.org/docs/ 
 */

var should = chai.Should();

//Backhand Stub-for-Testing Setup
chai.factory('participant', { 
	username: 'John Doe',
	guid: 'BACKHAND-TEST-USER-GUID',
	group_id: 'TEST-USER-GROUP'
});


describe('Dynamo', function() {
	
	describe('At the class level', function() {

		it('should exist', function() {
			should.exist(Dynamo);
		});	

	});

	describe('On Instantiation', function() {
		before(function() {});
	});

});