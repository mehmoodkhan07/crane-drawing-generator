# Design Decisions

## 1. Who is the user, and what do they need?

The user is a crane company sales or design engineer who needs a quick preliminary drawing by entering basic crane details. The user should also be able to save, open, edit and copy designs. I made this as a preliminary tool, not for final engineering approval or quotations.

## 2. What did you assume (crane type, inputs, units, ranges), and why?

I assumed a single-girder EOT crane with a wire-rope hoist because my reference drawing is for this type of crane. I used metric units such as tonnes, metres, metres per minute and millimetres. The ranges of 1 to 20 tonnes, 7.5 to 30 metres, A3 to A6 and 380V, 400V and 415V are my assumptions, not values taken from a standard. I did not include the 48V control voltage shown in the reference drawing. I could not install better-sqlite3, so I used the built-in SQLite module in Node.js instead.

## 3. Where did each formula or rule come from, and how sure are you?

From the reference drawing, I found a 250 mm wheel diameter for the 10-ton crane. The overall length is 25270 mm and the span is 25000 mm, so the difference is 270 mm. I used this difference for other spans too, but I checked only one drawing, so my confidence is medium.

For wheel load, I used a simple physics formula and got 72.31 kN. The drawing shows 74.8 kN. I did not change my formula to match the drawing, and I am not sure why there is a difference.

I got the 510 mm overall width difference from the drawing (4310 - 3800). I also used this difference for other crane sizes, but it is based on only one drawing. Wheelbase, girder height, headroom, trolley weight, crane weight and power are estimates. AI suggested span divided by 6.6 for wheelbase and span divided by 20 for girder height. I could not confirm their original source, so I marked them as low confidence. I also estimated a 315 mm wheel diameter after 12.5 tonnes. In the drawing, 7900 + 620 gives 8520 mm, but the floor-to-rail height is 8321 mm. I used 7.7 m in the seed because 8321 - 620 is about 7701 mm. I still do not know why the drawing has this difference. Every value in my app has a source and confidence label.

## 4. What did you leave out on purpose?

I left out double-girder and jib cranes because I focused on one crane type first. I also left out dynamic factors, FEM and ISO structural calculations, true-to-scale CAD or DXF drawings, and user login. I had around four hours to complete the work, so I focused on the main features and did not want to claim engineering rules that I could not verify.

## 5. What three questions would you ask our engineers?

What is the correct way to calculate wheelbase and girder height, and can the same method be used for different crane sizes?

How did the 74.8 kN maximum static wheel load in the drawing get calculated, and which weights and other values are included?

How are 7900 mm and 620 mm measured in the drawing, and how do they relate to the 8321 mm floor-to-rail height?

## 6. What would you do with another week?

First, I would check my formulas with engineers and compare them with more reference drawings. I would also correct the values that do not match and improve the confidence of my estimates. After that, I would work on double-girder support and PDF or DXF export. If there is enough time, I would also add login and ERP integration.