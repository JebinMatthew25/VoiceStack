class Voicer {
    constructor() {
        try {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
        } catch (e) {
            console.error(e);
            return {};
        }
        this.value = "";
        recognition.continuous = true;
        
        recognition.onresult = function (event) {

            const current = event.resultIndex;
            const transcript = event.results[current][0].transcript;
            const mobileRepeatBug = (current === 1 && transcript === event.results[0][0].transcript);

            if (!mobileRepeatBug) {
                this.value += transcript;
            }

            console.log("OnResult")
        }
    }

    val(value) {
        if (value === undefined) {
            return this.value
        } else {
            this.value = value;
        }
    }
}

const voicer = new Voicer();
console.debug(voicer instanceof Voicer);
if (!(voicer instanceof Voicer)) {
    console.debug("sad");
    // $('.no-browser-support').show();
    // $('.app').hide();
} else {
    console.debug("happy")
}


const noteTextarea = $('#note-textarea');
const instructions = $('#recording-instructions');
const notesList = $('ul#notes');

// Render notes from local storage
renderNotes(getAllNotes());
