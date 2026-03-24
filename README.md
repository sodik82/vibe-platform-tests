# Vibe platforms overview 2026

This is the comparision of most interesting vibe coding platforms that allows also non-tech people to built simple prototype (not only frontend but also something that can "work").
One of the criteria is how it can be "promoted" to production (assuming also some tech people)

* This is not exhausting lists (which is almost imposible to cover)

## Example application - prompt

* to provide "fair" comparision to different platforms which might have different technology preferences, prompt try not to force particular technologies (assumption is that non-tech people can start)

```
We want to build simple application that can A/B test design of our webpage. Therefore we want to be able create simple "experiment" for test users.

Experiment will be as following:
1. On first page - intro page there will be short info about how this experiment will go on and let user click when he is ready to start
2. Then we will show the user full screen image of our landing page (one tested variant), it will be shown for 10 seconds after which it will disapear
3. Then there will be a page with simple free text question asking in which area of business the company with this webpage is working.
4. Then next page will ask basically same question, only there there will be randomized choice options from options like software development, fashion, and come up with 3 different options.

* Once all answers are collected, they need to be stored so that we can download results.
* Tested users don't require authorization - it is anonymous
* Users can't change their answers if they are already on next page (there is no back functionality, of course page reload starts from scratch)
* Also partial answers shall be collected - once the user start, its session will have its own random generator and we will see how many users that started experiment, ends where in the funnel.
```

## Tested platforms

### Claude code

* not "easiest" choice for non-tech people but doable (aspecially when we assume there will be tech people anyway supporting moving to production)