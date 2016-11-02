
var tests = testData.split(/\n\n/m).map(function(text, index) {
	var m = text.trim().match(/^([\s\S]+)\[([\s\S]+):([\s\S]+)\]$/m);
	var question = (m[1] || "").trim().
		replace(new RegExp('\n','g'), '<br>').
		replace(new RegExp('^[ ]*' + (index + 1) + '\.[ ]*','m'), '');
	return {question: question, answer: m[2], comment: m[3]};
}).filter(function(t) {
	return t.question && t.answer && t.comment;
});

var currentQuestion = 0;
var collectedAnswers = [];

if (localStorage) {
	currentQuestion = +(localStorage[testId + '.currentQuestion'] || 0);
	collectedAnswers = (localStorage[testId + '.collectedAnswers'] || "").split(/[@][@][@]/);
}

function matchNumeral(nr, w1, w2, w5) {
	if (nr < 0)
		nr = -nr;
	nr = nr % 100;
	if (nr >= 20)
		return matchNumeral(nr % 10, w1, w2, w5);
	if (nr >= 5)
		return w5;
	if (nr >= 2)
		return w2;
	if (nr == 1)
		return w1;
	return w5;
}

function askQuestion(nr) {
	$('#question-title').html("Вопрос №" + (nr + 1) + ":");
	$('#question-body').html(tests[nr].question);

	$('#options-body').html(possibleAnswers.map(function(answers, sectionIndex){
		return (
			'<span class="section" id="options-section-' + sectionIndex + '">' + 
			answers.map(function(answer, answerIndex){
				return "<a href='#' id='option-" + sectionIndex + "-" + answerIndex + "' onclick='doAnswer(" + sectionIndex + ", " + answerIndex + "); return false;'>" + answer + "</a>"
			}).join('') +
			'</span>'
		);
	}).join(''));

	if (nr > 0) {
		$('#step-back').removeClass('display-none');
		$('#reset-test').removeClass('display-none');
	} else {
		$('#step-back').addClass('display-none');
		$('#reset-test').addClass('display-none');
	}
	$('#reset-test-2').addClass('display-none');

	$('#results-wrapper').addClass('display-none');
	$('#question-wrapper').removeClass('display-none');
	$('#test-wrapper').addClass('visible').removeClass('hidden');
}

function answersEqual(a1, a2) {
	if (a1 == a2)
		return true;

	a1 = a1.split(/, /).sort().join(', ');
	a2 = a2.split(/, /).sort().join(', ');
	return a1 == a2;
}

function displayResults() {
	var s = '';
	var s1 = '';
	var correctAnswers = 0;
	for (var nr = 0; nr < tests.length; nr++) {
		s += '<div class="result">';
		s += '<p class="question-title"> Вопрос №' + (nr + 1) + ':</p>';
		s += '</div>';
		if (answersEqual(tests[nr].answer, collectedAnswers[nr])) {
			s +=
				'<p class="answer-body">' + 
				'<span class="correct">Вы ответили правильно:</span> ' +
				'<span class="answer">' + tests[nr].answer + '</span> — ' +
				'<span class="comment">' + tests[nr].comment + '</span>' +
				'</p>';
			s1 += '<li class="answer"><span class="correct">' + tests[nr].answer + '</span></li>';
			correctAnswers++;
		} else {
			s +=
				'<p class="answer-body">' + 
				'<span class="wrong">Вы ответили неправильно: </span> ' +
				'<span class="answer">' + collectedAnswers[nr] + '</span><br>' +
				'Правильный ответ: <span class="answer">' + tests[nr].answer + '</span>' +
				(tests[nr].comment ? ' — <span class="comment">' + tests[nr].comment + '</span>' : '') +
				'</p>';
			s1 +=
				'<li class="answer">' +
				'<span class="wrong"><s>' + collectedAnswers[nr] + '</s></span> → ' +
				'<span class="correct">' + tests[nr].answer + '</span>' +
				'</li>';
		}

		s += '<p class="question-body">' + tests[nr].question + '</p>';
	}

	s = 
		'<p class="total-nr"> Вы ответили правильно на ' +
			correctAnswers + ' ' +
			matchNumeral(correctAnswers, 'вопрос', 'вопроса', 'вопросов') +
			' из ' + tests.length + ':' + 
		'</p>' +
		'<ol>' + s1 + '</ol>' +
		s;

	$('#results-wrapper').html(s);

	$('#step-back').addClass('display-none');
	$('#reset-test').addClass('display-none');
	$('#reset-test-2').removeClass('display-none');

	$('#results-wrapper').removeClass('display-none');
	$('#question-wrapper').addClass('display-none');
	$('#test-wrapper').addClass('visible').removeClass('hidden');
}

function updateInteface() {
	if (currentQuestion >= tests.length) {
		displayResults();
	} else {
		askQuestion(currentQuestion);
	}
}

function react() {
	$('#test-wrapper').addClass('hidden').removeClass('visible');

	if (localStorage) {
		localStorage[testId + '.currentQuestion'] = currentQuestion;
		localStorage[testId + '.collectedAnswers'] = collectedAnswers.join("@@@");
	}

	setTimeout(updateInteface, 500);
}

function doAnswer(sectionIndex, answerIndex) {
	$('#options-section-' + sectionIndex + ' a').removeClass('selected');
	$('#option-' + sectionIndex + '-' + answerIndex).addClass('selected');

	var selected = $('#options-body a.selected');
	if (selected.length == possibleAnswers.length) {
		collectedAnswers[currentQuestion] = selected.map(function() {
			return $(this).html();
		}).get().sort().join(', ');
		currentQuestion++;
		react();
	}
}

function stepBack() {
	if (currentQuestion > 0)
		currentQuestion--;
	react();
}

function resetTest() {
	currentQuestion = 0;
	collectedAnswers = [];
	react();
}

$(document).ready(function() {

	var html_skeleton = "\
<h1 id='test-title'></h1>\
\
<div id='test-wrapper' class='hidden'>\
\
<div id='question-wrapper'>\
	<p id='question-title'></p>\
	<p id='question-body'></p>\
\
	<p id='options-title'></p>\
\
	<p id='options-body'></p>\
</div>\
\
<div id='results-wrapper' class='display-none'>\
</div>\
\
<p id='buttons'>\
	<a class='button' href='#' onclick='stepBack(); return false;' id='step-back'> &lt;&lt; На шаг назад</a>\
	<a class='button' href='#' onclick='resetTest(); return false;' id='reset-test'>Начать заново</a>\
	<a class='button' href='#' onclick='resetTest(); return false;' id='reset-test-2'>Пройти тест еще раз</a>\
</p>\
\
</div>\
";

	$('#test-container').html(html_skeleton);

	$('#test-title').html(testTitle);
	document.title = testTitle;
	$('#options-title').html(optionsTitle);
	updateInteface();
});
