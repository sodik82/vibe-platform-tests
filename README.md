# Vibe platforms overview 2026

This is the comparision of most interesting vibe coding platforms that allows also non-tech people to built simple prototype (not only frontend but also something that can "work").
One of the criteria is how it can be "promoted" to production (assuming also some tech people)

* This is not exhausting lists (which is almost imposible to cover)

## Example application - prompt

* to provide "fair" comparision to different platforms which might have different technology preferences, prompt try not to force particular technologies (assumption is that non-tech people can start)
* the prompt does not specify the details that tech people will mention - like authenticated admin for download - we will see how the platforms will deal with it

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

### Claude code - plain

* not "easiest" choice for non-tech people but doable (aspecially when we assume there will be tech people anyway supporting moving to production)
* plain - just using prompt as is, no planing, simple answers if needed
* first version
  * well, we don't want to influence the users ;-)
  ![plain1](image.png)
  * there was bug - I put there my png file, but file was not shown (forcing jpg extension) - I ask him to fix it just describing the bug from user perspective
* fixed version works - rather simple, just filesystem as storage, no authorization for download but allows to test multiple variants.
* running it locally require simple command line (but claude code lives in command line ;-))
* deployment would be non-trivial for non-tech people - simple nodejs application
* used 20% of my 5 hour window (pro plan)

### Claude code - meta prompt

* we took prompt and let AI enhance it before passing it to claude code (again no preferences from user about tech stack, I let him pick)

```
Role & Goal:
You are an expert full-stack developer. I want you to build a lightweight, anonymous A/B testing and survey application. The goal is to show users a landing page variant, ask them memory-based questions, and track their drop-off rates in a funnel.

Tech Stack:

Framework: Next.js (App Router)

Styling: Tailwind CSS

Database: Supabase (using @supabase/supabase-js)

Icons: Lucide React (if needed)

Core Architecture & State:

Anonymous Tracking: When a user clicks start, immediately generate a unique sessionId (UUID).

A/B Assignment: Randomly assign the user to either "Variant A" or "Variant B" (representing two different placeholder image URLs) at the start of the session. Save this assignment to Supabase immediately.

Strict Linear Progression: Users cannot go back. Handle the step progression via a single-page React state machine so the browser "Back" button doesn't mess up the flow. If the page is reloaded, they start from scratch.

Continuous Saving: Update the Supabase row asynchronously in the background every time the user completes a step. This is crucial so we capture partial answers and can analyze exactly where users drop off in the funnel.

User Flow (Step-by-Step):

Intro Step: A minimalist screen with a short title and description explaining the experiment. Include a prominent "Start Experiment" button. Clicking this generates the session ID, assigns the variant, and logs "Step 1 complete" to Supabase.

Exposure Step: Show a full-screen image of the assigned landing page variant. Remove all other UI elements. Hardcode a timer so the image is shown for exactly 10 seconds, after which it automatically transitions to the next step.

Free-Text Question Step: Display a clean, centered form asking: "Based on what you just saw, in which area of business is this company working?" Provide a text area and a "Next" button.

Multiple Choice Step: Ask basically the same question, but provide randomized multiple-choice buttons: "Software Development", "Fashion", "Healthcare", and "Other". Clicking an option saves the answer and moves them to the final step.

Thank You Step: A simple screen thanking them for their time.

Database Schema & Export:

Provide me with the SQL snippet I need to run in my Supabase SQL Editor to create the experiment_results table. It should capture: id, session_id, variant_assigned, highest_step_reached (1-5), free_text_answer, multiple_choice_answer, and created_at.

Create a simple, unstyled, hidden route at /admin that fetches all records from Supabase and allows me to download them as a CSV file.

UI/UX Vibe:
The design should be extremely clean, modern, and distraction-free. Use a white or very light gray background with highly legible sans-serif typography. Keep the content centered on the screen.
```

* stack is more "profesional" but it is even more complicated for non-tech to run
* I followed AI instructions, needed extra help and first version fails with "invisible (for user/non-tech)" error in browser console
![meta1](image-1.png)
  * probably my mistake (shall not use npm start - which was my first option) but most likely non-tech person wouldn't know or even see the error
* it is using "legacy" tokens
* nice admin
![meta2](image-2.png)
* variants are not simple files in repo - need to upload it somewhere...