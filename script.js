let SpeechRecognition;
let recognition;

try {
    SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();

} catch (e) {
    console.error(e);
    $('.no-browser-support').show();
    $('.app').hide();
}


let noteTextarea = $('#note-textarea');
let instructions = $('#recording-instructions');
let notesList = $('ul#notes');

let noteContent = '';

// Get all notes from previous sessions and display them.
let notes = getAllNotes();
renderNotes(notes);


/*-----------------------------
      Voice Recognition 
------------------------------*/

// If false, the recording will stop after a few seconds of silence.
// When true, the silence period is longer (about 15 seconds),
// allowing us to keep recording even when the user pauses. 
recognition.continuous = false;

// This block is called every time the Speech APi captures a line. 
recognition.onresult = function (event) {

    // event is a SpeechRecognitionEvent object.
    // It holds all the lines we have captured so far. 
    // We only need the current one.
    const current = event.resultIndex;

    // Get a transcript of what was said.
    const transcript = event.results[current][0].transcript;

    // Add the current transcript to the contents of our Note.
    // There is a weird bug on mobile, where everything is repeated twice.
    // There is no official solution so far so we have to handle an edge case.
    const mobileRepeatBug = (current === 1 && transcript === event.results[0][0].transcript);

    if (!mobileRepeatBug) {
        noteContent += transcript;
        noteTextarea.val(noteContent);
    }
    setState(states.STOPPED);
};

recognition.onstart = function () {
    instructions.text('Voice recognition activated. Try speaking into the microphone.');
};

recognition.onspeechstart = function () {
    setState(states.SPEECH_START);
};

recognition.onspeechend = function () {
    if (btnState === states.RECORDING) {
        instructions.text('You were quiet for a while so voice recognition turned itself off.');
        setState(states.STOPPED);
    }
};

recognition.onerror = function (event) {
    if (event.error === 'no-speech') {
        instructions.text('No speech was detected. Try again.');
        setState(states.STOPPED);
    }
};


/*-----------------------------
      App buttons and input 
------------------------------*/
const mainBtn = $('#main-btn');
const states = {
    RECORDING: 1,
    STOPPED: 2,
    LISTENING: 3,
    SPEECH_START: 4
};

let btnState = states.STOPPED;

function setState(state) {
    btnState = state;
    switch (state) {
        case states.RECORDING:
            mainBtn.removeClass('btn-warning btn-success').addClass('btn-danger');
            mainBtn.html('Stop Recording');
            if (noteContent.length) {
                noteContent += ' ';
            }
            recognition.start();
            setState(states.LISTENING);
            break;
        case states.STOPPED:
            mainBtn.removeClass('btn-danger btn-warning').addClass('btn-success');
            mainBtn.html('Start Recording');
            recognition.stop();
            break;
        case states.LISTENING:
            mainBtn.removeClass('btn-success btn-danger').addClass('btn-primary');
            mainBtn.html('Listening...');
            break;
        case states.SPEECH_START:
            mainBtn.removeClass('btn-success btn-danger').addClass('btn-primary');
            mainBtn.html('Processing...');
            break;
        default:
            throw new DOMException()
    }
}

mainBtn.on('click', function (e) {
    if (btnState !== states.STOPPED) {
        setState(states.STOPPED);
        instructions.text('Voice recognition paused.');
    } else {
        setState(states.RECORDING);
    }
});


// Sync the text inside the text area with the noteContent variable.
noteTextarea.on('input', function () {
    noteContent = $(this).val();
});

$('#save-note-btn').on('click', function (e) {
    recognition.stop();

    if (!noteContent.length) {
        instructions.text('Could not save empty note. Please add a message to your note.');
    } else {
        // Save note to localStorage.
        // The key is the dateTime with seconds, the value is the content of the note.
        saveNote(new Date().toLocaleString(), noteContent);

        // Reset variables and update UI.
        noteContent = '';
        renderNotes(getAllNotes());
        noteTextarea.val('');
        instructions.text('Note saved successfully.');
    }

});


notesList.on('click', function (e) {
    e.preventDefault();
    var target = $(e.target);

    // Listen to the selected note.
    if (target.hasClass('listen-note')) {
        var content = target.closest('.note').find('.content').text();
        readOutLoud(content);
    }

    // Delete note.
    if (target.hasClass('delete-note')) {
        var dateTime = target.siblings('.date').text();
        deleteNote(dateTime);
        target.closest('.note').remove();
    }
});


/*-----------------------------
      Speech Synthesis 
------------------------------*/

function readOutLoud(message) {
    var speech = new SpeechSynthesisUtterance();

    // Set the text and voice attributes.
    speech.text = message;
    speech.volume = 1;
    speech.rate = 1;
    speech.pitch = 1;

    window.speechSynthesis.speak(speech);
}


/*-----------------------------
      Helper Functions 
------------------------------*/

function renderNotes(notes) {
    var html = '';
    if (notes.length) {
        notes.forEach(function (note) {
            html +=
                `<li class="note d-flex justify-content-between align-items-center">
                    <p style="display:none" class="date">${note.date}</p>
                    <p class="content">${note.content}</p>
                    <div>
<!--                        <i class="fas fa-play listen-note"></i>-->
<!--                        <i class="fas fa-times delete-note"></i>                    -->
                        <button class="btn btn-success fas fa-play listen-note"></button>
                        <button class="btn btn-danger fas fa-times delete-note"></button>                    
                    </div>
                </li>`;
        });
    } else {
        html = '<li><p class="content">You don\'t have any notes yet.</p></li>';
    }
    notesList.html(html);
}


function saveNote(dateTime, content) {
    localStorage.setItem('note-' + dateTime, content);
}


function getAllNotes() {
    var notes = [];
    var key;
    for (var i = 0; i < localStorage.length; i++) {
        key = localStorage.key(i);

        if (key.substring(0, 5) === 'note-') {
            notes.push({
                date: key.replace('note-', ''),
                content: localStorage.getItem(localStorage.key(i))
            });
        }
    }
    return notes;
}


function deleteNote(dateTime) {
    localStorage.removeItem('note-' + dateTime);
}

