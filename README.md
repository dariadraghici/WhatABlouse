# What A Blouse

## Overview

What A Blouse is a browser-based garment classification application that constitutes the foundation of a larger project I am developing, called PICKyourFIT. This repository should be understood as a proof-of-concept stage: it isolates and addresses the single technical problem on which the larger application depends, namely the ability to determine, automatically and without human input, what category of clothing a given photograph depicts. The outfit-generation functionality that PICKyourFIT will eventually provide is deliberately excluded from this version. The objective here was narrower in scope: to establish that automatic, in-browser garment recognition could be made sufficiently reliable to serve as the basis for a more complex application.

## Motivation

The idea originated from a recurring and fairly mundane frustration. Whenever I prepared for a trip, I would find myself standing in front of my own wardrobe, losing a disproportionate amount of time deciding what to pack, despite owning more than enough clothing to assemble several reasonable outfits. The problem was never a shortage of options; it was the absence of any structured overview of what I actually owned and of how those items could be combined. This observation led to the concept of PICKyourFIT: an application in which a user digitises their wardrobe once, item by item, and subsequently receives generated outfit suggestions on demand, eliminating both the guesswork and the time lost in the process.

Before any outfit-generation logic could be meaningfully implemented, however, the application first required a reliable means of determining, from a photograph alone, what kind of garment it was looking at. Building and validating that recognition layer became the entire scope of the present project.

## Functionality

The interface presents a single drop zone. When a user uploads or drags in a photograph of a garment, the application proceeds through the following sequence:

1. The image is read locally in the browser and displayed as a preview.
2. The image is passed to a machine learning model running entirely within the browser, which returns a probability distribution across every garment category it has been trained to recognise.
3. The application evaluates this probability distribution to determine, automatically, whether the image plausibly depicts a clothing item at all, and, separately, how confident it is in the specific category selected.
4. Depending on that confidence, the user is shown either a single predicted category, a short list of plausible alternatives, or a notice indicating that the image does not appear to depict clothing.
5. The user may accept the prediction or correct it manually, after which the item can be added to a virtual wardrobe organised by section (upper body, lower body, full body, shoes, head) and further by sub-category (shirt, blazer, sneakers, and so on).
6. Prior to being stored, the background of the image is removed automatically, so that every wardrobe item is rendered as an isolated garment on a transparent background rather than as a full photograph with its surroundings.
7. Each wardrobe item may additionally be annotated with a brand name and a short description.

## On the absence of persistent storage

A deliberate characteristic of this version of the project is that no data is retained outside the current browser session. The entire wardrobe exists solely in memory, within a JavaScript data structure that persists only for as long as the page remains open. There is no backend, no database, and no use of browser storage mechanisms to retain information between visits. Consequently, refreshing the page, closing the tab, or navigating away erases the wardrobe in its entirety, with no possibility of recovery.

This was a deliberate decision regarding scope rather than an oversight. The purpose of this stage was to validate the classification pipeline itself, not to construct a persistence layer, an account system, or a database schema. Wardrobe persistence, along with the outfit-generation engine, is reserved for PICKyourFIT.

## Training the classification model

Garment recognition is performed by a custom image classification model trained using Google's Teachable Machine platform and subsequently exported as a TensorFlow.js model, which is loaded and executed entirely within the browser through the TensorFlow.js and Teachable Machine Image libraries. No image is transmitted to a remote server for classification; inference occurs locally, on the user's own device.

The model was trained on a manually assembled image dataset. For every distinct garment category the model was required to recognise (T-shirt, blouse, shirt, jacket, blazer, pullover, hoodie, crop top, turtle neck, tank top, shorts, pants, skirt, tights, leggings, dress, bodysuit, jumpsuit, romper, socks, boots, sneakers, heels, glasses, and a dedicated category for images that do not depict clothing at all), a minimum of thirty representative photographs was collected and labelled. This minimum was treated as a strict constraint during dataset construction, rather than as an average, because the transfer-learning approach underlying Teachable Machine is highly sensitive to class imbalance: a category trained on a noticeably smaller sample tends to be systematically under-recognised relative to better-represented classes, regardless of how visually distinct that category might be to a human observer. Maintaining a consistent floor across every class was therefore essential to preserving even prediction quality, rather than allowing it to skew toward whichever categories happened to be easiest to photograph.

## The entropy-based confidence mechanism

A structural limitation of this kind of classifier is that it will always output a probability for every class it has been trained on, regardless of whether the input image bears any relation to those classes. A photograph of a wall, an animal, or a human face still produces a complete probability vector across all garment categories, since the model has no inherent notion of "none of the above." Without correction, this would lead the application to confidently assign a garment label, such as "blazer" or "leggings," to an image that is not clothing at all.

To address this, the application uses Shannon entropy, a measure from information theory that quantifies the uncertainty, or dispersion, of a probability distribution. The intuition is straightforward: when the model is shown a genuine, recognisable garment, the output distribution tends to be concentrated, with most of the probability mass assigned to one or two classes. This corresponds to low entropy. When the model is shown an image unrelated to any of its training categories, it has no principled basis for favouring one class over another, so the probability mass spreads out roughly evenly across all classes. This corresponds to high entropy.

Formally, for a probability distribution p₁, p₂, ..., pₙ over n classes, Shannon entropy is defined as:

H(p) = − Σ pᵢ · log₂(pᵢ), for i = 1 to n

The theoretical maximum of this quantity occurs when the distribution is perfectly uniform, that is, when every class is equally likely (pᵢ = 1/n for all i). In that case, the entropy simplifies to:

H_max = log₂(n)

Dividing the observed entropy by this theoretical maximum gives a normalised entropy value bounded between 0 and 1:

H_norm = H(p) / H_max

A value close to 0 indicates a highly concentrated, confident distribution; a value close to 1 indicates a distribution indistinguishable from uniform noise, that is, total uncertainty.

### The confidence threshold for ambiguous cases

For images that pass the entropy check, that is, where H_norm remains below 0.80, a second, independent threshold governs how the result is presented to the user. If the highest individual class probability reaches at least 72 percent, the prediction is treated as reliable enough to be displayed directly. If it falls below that figure, rather than silently committing to a possibly incorrect guess, the interface presents the leading candidate categories side by side, each with its corresponding confidence percentage, and defers the final decision to the user.

The combination of these two independent checks, an entropy-based filter that addresses the question "is this clothing at all," and a confidence-based filter that addresses the question "which specific garment is this," constitutes the central design decision underlying the classification system.

## Technologies and APIs used

- HTML, CSS and vanilla JavaScript for the entire front end, with no framework dependency.
- TensorFlow.js, used as the runtime executing the trained model directly within the browser.
- The Teachable Machine Image library, used to load the exported model and to run real-time predictions on uploaded images.
- Google Teachable Machine, used as the platform on which the underlying classification model was trained, on the manually assembled dataset described above.
- The remove.bg API, used to remove the background from each accepted image prior to its inclusion in the wardrobe.
- Google Fonts, for the Fraunces, Inter and JetBrains Mono typefaces used throughout the interface.

## Closing note

This project constitutes the foundation, not the final product. The classification and confidence-handling logic documented here is the mechanism on which the next, considerably more ambitious project will rely. PICKyourFIT, the full wardrobe-management and outfit-generation application built on top of this groundwork, is coming soon.

---

Copyright Daria-Ioana Draghici, June 2026