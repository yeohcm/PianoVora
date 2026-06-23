# Requirements Verification Clarification Questions

I detected an ambiguity in your response to Question 5 regarding the feedback prevention switch:

## Ambiguity 1: Mode Switch Behavior
Your response "have a switch button to switch the mode" could be implemented in a few different ways. We need to clarify how this mode switch should behave in relation to the microphone and sound synthesis.

### Clarification Question 1
How should the mode switch behave?

A) A toggle between **Mic Mode** (microphone active for pitch detection, key click sounds disabled) and **Synth Mode** (microphone disabled, key click sounds enabled) — this completely prevents feedback loops by making the modes mutually exclusive.
B) An independent **Sound Output** toggle (On/Off). When ON, clicking virtual keys plays sound. When OFF, they are silent. The microphone toggle remains independent (meaning both can be enabled at once, and the user must manage feedback).
C) Other (please describe after [Answer]: tag below)

[Answer]: A
