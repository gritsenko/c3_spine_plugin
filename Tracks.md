# ACEs for adding track functionality
### 1.21.0 2020/12/04

Developer manages animations and which track they are on.
Specify track number for all ACEs as needed.
{n} = parameter n

Track number parameters will default to 0, so all current projects will continue to work as is.

## ACEs Changes
### Actions
- *DONE* Set animation {0} start at {2}, (loop: {1}) on track {3} 
- *DONE* Set animation time in {0} to {1} on track {2} 
- *DONE* Delete animation on track {0} with mix {1}
- *DONE* Set alpha on track {0}

### Expressions
- *DONE* Get current animation name on track {0}
- *DONE* Animation start time on track {0}
- *DONE* Animation end time on track {0}
- *DONE* Animation last time on track {0}
- *DONE* Animation track time on track {0}
- *DONE* Animation alpha on track {0}

### Conditions
+ *DONE* On animation {0} finished on track {1}
+ *DONE* On event {0} on track {1}
+ *DONE* Is animation {0} playing on track {1}

## Implementation notes
- No change:
    - Play spine animation (stops all tracks)
    - Stop current spine animation (stops all tracks)
    - Set animation speed {0}x (all tracks)

- For delete animation, use addEmptyAnimation or setEmptyAnimation with mix duration to blend, possibly add duration as parameter.
    - http://esotericsoftware.com/spine-api-reference#AnimationState-setEmptyAnimation
    - http://esotericsoftware.com/spine-api-reference#AnimationState-addEmptyAnimation

