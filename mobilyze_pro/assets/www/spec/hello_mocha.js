// hello_mocha.js
var should = chai.Should();

describe('My First Test', function() {
	console.log ('inside describe 1');
	
	describe ('my first sub-block', function() {
		console.log ('inside describe 2');
		
		it('1st test should pass', function() {
			console.log ('inside it 1');
			true.should.equal(true);
		});

		it('2nd test should also pass', function() {
			true.should.equal(true);
		});

	});

	describe ('my 2nd sub-block', function() {
		it('3rd test should also pass', function() {
			true.should.equal(true)
		});
	});

});

describe('My 2nd block', function() {
	describe ('my 1st 2nd sub-block', function() {
		it('4th test should pass', function() {
			true.should.equal(true);
		});
	});
});