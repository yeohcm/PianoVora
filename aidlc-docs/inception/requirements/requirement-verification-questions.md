# Requirements Verification Questions

Please answer the following questions to clarify the requirements for the key press sound playback feature. Provide your answer by placing the option letter (e.g., A, B, C) directly after the `[Answer]:` tag for each question.

---

## Question 1: Security Extensions
Should security extension rules be enforced for this project?

A) Yes — enforce all SECURITY rules as blocking constraints (recommended for production-grade applications)
B) No — skip all SECURITY rules (suitable for PoCs, prototypes, and experimental projects)
X) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## Question 2: Property-Based Testing Extension
Should property-based testing (PBT) rules be enforced for this project?

A) Yes — enforce all PBT rules as blocking constraints (recommended for projects with business logic, data transformations, serialization, or stateful components)
B) Partial — enforce PBT rules only for pure functions and serialization round-trips (suitable for projects with limited algorithmic complexity)
C) No — skip all PBT rules (suitable for simple CRUD applications, UI-only projects, or thin integration layers with no significant business logic)
X) Other (please describe after [Answer]: tag below)

[Answer]: C

---

## Question 3: Sound Trigger Source
What interactions should trigger playing a sound?

A) On-screen virtual piano keyboard key clicks/taps only
B) On-screen virtual piano keyboard key clicks/taps AND physical computer keyboard key presses (e.g., mapped keys like ASDF)
C) On-screen virtual piano keyboard key clicks/taps AND external MIDI input device key presses
D) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 4: Audio Synthesis Type
What method should be used to synthesize the piano/note sound?

A) Web Audio API oscillators (e.g., sine/triangle wave with an ADSR envelope) generated completely client-side with zero external assets
B) Pre-recorded audio sample files (requires loading external sound files/assets)
C) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 5: Audio Feedback Loop Prevention
Since the microphone is capturing audio for pitch detection, playing a note sound from the speakers might cause a feedback loop (the mic hears the speaker sound and detects it as a new pitch). How should we address this?

A) Warn the user to use headphones or adjust volume, but perform no automatic muting of the microphone loop
B) Automatically mute/ignore microphone pitch detection temporarily when a virtual key is clicked/played
C) Other (please describe after [Answer]: tag below)

[Answer]: have a switch button to switch the mode

---

## Question 6: Polyphony Support
Should the keyboard sound playback support polyphony (playing multiple notes/chords simultaneously)?

A) Monophonic (only one note plays at a time; starting a new note cuts off the previous note)
B) Polyphonic (multiple notes can play simultaneously and decay naturally)
C) Other (please describe after [Answer]: tag below)

[Answer]: A
