Haan bhai ❤️ ab theory chhodte hain. Main tumhe exactly kya karna hai, kis order mein karna hai bata raha hoon. Tum beginner ho is round mein, isliye hum simple working MVP banayenge — unnecessary MERN complexity nahi.

🎯 Tumhe kya banana hai?

Ek Contribution / Settlement Tracker.

Example:

Pool: Farewell Gift
Budget: ₹6000

Members:
Chetan
Rahul
Amit
Priya
Neha
Rohit

App automatically batayega:

Har person ka share = ₹1000
Kisne kitna pay kiya
Kisne kitna aur dena hai
Kisne extra diya
Total kitna collect hua
Kitna remaining hai
End mein kaun kisko kitna pay kare
🛠️ Hum isko 4 steps mein banayenge
STEP 1

Basic React UI

STEP 2

Payment + balance calculation

STEP 3

Settlement algorithm

STEP 4

GitHub Codespace → Git → Submit

🔥 STEP 1 — Sabse pehle project banao

Tumhare Codespace mein terminal open karo.

Ye commands run karo:

npm create vite@latest farewell-settlement -- --template react

Phir:

cd farewell-settlement

Phir:

npm install

Phir:

npm run dev

Terminal tumhe ek URL dega, something like:

http://localhost:5173

Us URL ko open karo.

🟢 STEP 2 — Project structure

Abhi simple rakho:

farewell-settlement/
│
├── src/
│   ├── App.jsx
│   ├── App.css
│   └── main.jsx
│
├── package.json
└── index.html

Bas itna hi chahiye initially.

🧠 STEP 3 — Data kaise store karna hai?

Ye sabse important concept hai.

Ek member:

{
  id: 1,
  name: "Chetan",
  paid: 1000
}

Example:

const members = [
  { id: 1, name: "Chetan", paid: 1000 },
  { id: 2, name: "Rahul", paid: 500 },
  { id: 3, name: "Amit", paid: 1500 },
  { id: 4, name: "Priya", paid: 1000 },
  { id: 5, name: "Neha", paid: 0 },
  { id: 6, name: "Rohit", paid: 1000 }
];

Total:

const totalAmount = 6000;

Members:

const numberOfMembers = members.length;

Fair share:

const share = totalAmount / numberOfMembers;

Result:

6000 / 6 = 1000
🧮 STEP 4 — Balance calculate karo

Formula yaad kar lo:

Balance = Paid - Share

Code:

const balance = member.paid - share;

Example:

Rahul
Paid = ₹500
Share = ₹1000

Balance = 500 - 1000
        = -500

Meaning:

Rahul owes ₹500.

Amit
Paid = ₹1500
Share = ₹1000

Balance = 1500 - 1000
        = +500

Meaning:

Amit should receive ₹500.

Chetan
Paid = ₹1000
Share = ₹1000

Balance = 0

Meaning:

Settled.

🟡 STEP 5 — Dashboard banao

UI mein top par 3 cards:

┌──────────────┐
│ Total Budget │
│    ₹6000     │
└──────────────┘

┌──────────────┐
│  Collected   │
│    ₹5000     │
└──────────────┘

┌──────────────┐
│  Remaining   │
│    ₹1000     │
└──────────────┘

Formula:

const collected = members.reduce(
  (sum, member) => sum + member.paid,
  0
);

const remaining = totalAmount - collected;
🟣 STEP 6 — Members table

Table:

Name      Share      Paid       Balance       Status
--------------------------------------------------------
Chetan    ₹1000      ₹1000        ₹0           Settled
Rahul     ₹1000      ₹500        -₹500         Owes
Amit      ₹1000      ₹1500       +₹500         Gets
Priya     ₹1000      ₹1000        ₹0           Settled
Neha      ₹1000      ₹0          -₹1000        Owes
Rohit     ₹1000      ₹1000        ₹0           Settled

Status logic:

if (balance < 0) {
  // Owes
} else if (balance > 0) {
  // Gets money
} else {
  // Settled
}
🔥 STEP 7 — Settlement

Ye last mein banana.

Sabse pehle members ko 2 groups mein divide karo:

Debtors
Rahul   -500
Neha   -1000
Creditors
Amit   +500

Ab settlement:

Rahul → Amit ₹500
Neha  → Amit ₹500

Lekin ek important issue hai:

Total budget ₹6000 hai aur total paid ₹5000.

Toh ₹1000 abhi collect hi nahi hua.

Isliye UI mein clearly:

₹1,000 still needs to be collected

dikhana hai.

Haan bhai! 🔥 Agar tum Codespace ke Agent/Codex se banwa rahe ho, toh manually 20 commands karne ki zarurat nahi hai. Ek strong prompt do aur Codex ko पूरा MVP banane bolo.

Tumhare screenshot mein right side Build with Agent hai. Wahi use karo.

🚀 STEP 1 — Codex/Agent mein ye पूरा prompt paste karo
Build a complete, simple and polished React application for this coding assessment problem:

"Chipping in for the farewell gift"

The app is a generic contribution pool and settlement tracker.

Requirements:

1. Use React with Vite.
2. Use JavaScript, not TypeScript.
3. Keep the application simple and easy to understand.
4. No backend, database, authentication or external API is required.
5. Use React state and localStorage for persistence.
6. Create a clean responsive UI suitable for a student coding assessment.

CORE FEATURES:

A. Create Pool
- Pool name
- Total budget
- Organizer name
- Create pool button

B. Add Members
- Add multiple members
- Each member has:
  - id
  - name
  - paid amount
- Allow removing members.
- Prevent duplicate/empty member names.

C. Equal Share
- fairShare = totalBudget / numberOfMembers
- Display each member's fair share.

D. Payments
- Allow entering/updating how much each member has paid.
- Calculate:
  balance = paidAmount - fairShare

If balance < 0:
  member owes money

If balance > 0:
  member should receive money

If balance = 0:
  member is settled

E. Dashboard
Clearly show:
- Total Budget
- Total Collected
- Remaining To Collect
- Number of Members
- Equal Share

Also show a members table with:
Name | Fair Share | Paid | Balance | Status

F. Settlement
Create a simple settlement algorithm.

Separate members into:
- debtors: balance < 0
- creditors: balance > 0

Generate simple transactions:
"Rahul pays Amit ₹500"

Match debtors with creditors until balances are settled as much as possible.

The settlement algorithm should minimize the number of transactions using a greedy approach.

G. Important logic
- If total collected is less than total budget, clearly show the remaining amount to collect.
- If total collected equals the budget, show that the pool is fully collected.
- Handle decimal amounts safely and display currency as ₹.
- Handle zero members safely.
- Handle zero budget safely.
- Do not allow negative payments.
- Do not allow negative budget.

H. UI
Create these sections:
1. Header
2. Pool creation/setup
3. Members
4. Dashboard summary cards
5. Contribution table
6. Settlement section

Use a simple modern light theme.
Use cards, tables, buttons and clear status badges.
Make it responsive.
Do not over-engineer the UI.

I. Sample data
Include an easy "Load Demo Data" button so I can immediately demonstrate the application.

Demo:
Budget = ₹6000
Members:
Chetan - ₹1000
Rahul - ₹500
Amit - ₹1500
Priya - ₹1000
Neha - ₹0
Rohit - ₹1000

J. Code quality
- Use reusable React components where useful.
- Keep calculations in clear functions.
- Add comments only for important logic.
- No unnecessary libraries.
- Make the code beginner-friendly.

K. Final testing
After creating the application:
1. Install dependencies.
2. Run the application.
3. Fix any build/runtime errors.
4. Make sure the app works correctly.
5. Give me a short summary of what files were created/changed and how to run the app.

Do not just explain the code. Actually create and modify the files in the current workspace and imple


Update the existing React + Vite contribution pool and settlement tracker with ONLY this new requirement:

"The solution must also import a messy list of past contributions — with duplicate entries, the same person’s name spelled differently, amounts written in inconsistent formats, and some invalid rows. Import it, produce correct balances from the cleaned data, and report what was imported, de-duplicated, merged, and rejected."

IMPORTANT:
Do NOT rewrite or remove the existing working functionality.

Preserve:

Pool creation
Budget
Organizer
Add/remove members
Manual payment entry
Total collected
Remaining amount
Fair/equal share
Individual balances
Settlement suggestions
localStorage
Existing responsive/light UI
Existing demo functionality
Add a new "Import Past Contributions" feature.

Because the final statement does not specify an exact file format, implement a simple and practical import flow using CSV upload and pasted text. Keep the parsing code modular so the parser can be changed later if needed.

Requirements:

Import contribution records containing name and amount.

Normalize names:

trim whitespace
normalize repeated spaces
compare case-insensitively
recognize capitalization/spacing variants such as:
Chetan
chetan
CHETAN
" Chetan "
as the same person.
Do not aggressively merge unrelated names.

Normalize amounts:
Support common formats such as:
1000
1000.00
₹1000
₹ 1,000
1,000
Rs. 1000
Convert them to a consistent numeric value for calculations.

Validate every row.
Reject rows with:
missing name