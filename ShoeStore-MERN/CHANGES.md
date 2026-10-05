# ShoeStore MERN — New features (kya kya add hua)

## Chalane ka tareeqa
```
cd mern/server && npm install        # naya package: express-async-errors
npm run migrate                      # EK BAAR: purane shoe products ko placeholder cost price dena (profit ke liye)
npm run dev                          # backend (.env mein tumhara Atlas URI already hai)

cd mern/client && npm install && npm run dev
```
Optional demo: `npm run seed:demo` — sirf 2 demo shops (admin@stepup.pk / admin@stylehub.pk, Admin@123) mein 6 mahine ka
fake data bharta hai taake Profit/Loss aur Forecast dikhe. (Tumhari apni real shops ko touch nahi karta, lekin in 2 demo shops ka purana sales/expense data delete karta hai.)

## 1) Salesman / Staff page (Shoes + Clothes dono)
Shoes: `/dashboard/salesmen`, Clothes: `/clothes/staff` (same component, apni theme ke saath)
- Aaj ki attendance: Present / Absent buttons, "Mark all present"
- Attendance calendar (Sunday off, future din locked)
- **Advance**: kisi ko bhi advance do (date + note). Usi mahine ki salary se kat-ta hai
- Bonus, Salary: net payable = earned + bonus − advance. Advance salary se zyada ho to excess dikhta hai
- Pay / Undo salary, month wise salary table

## 2) Suppliers page (Shoes + Clothes dono)
Shoes: `/dashboard/suppliers`, Clothes: `/clothes/suppliers`
- Har supplier ka ledger: kitna maal aaya (units), kitna kharida, kitna diya, **kitna pending**
- Purchase Order: items + qty + cost, advance payment, expected delivery
- Partial payments (overpay block), payment history, payment remove
- **Receive stock**: inventory me stock khud barh jata hai + cost price weighted average se update
- Profit/Loss page se "Create purchase order" (kam stock wale items pehle se fill)

## 3) Profit & Loss (naya, Shoes + Clothes)
Shoes: `/dashboard/finance`, Clothes: `/clothes/finance`
- Monthly: revenue, cost of goods, gross profit, salaries, expenses, **net profit/loss** + chart
- Month par click: top products by profit, payment mix, expenses
- **Forecast**: agle 3 mahine ka revenue/profit (confidence ke saath), is mahine ka projection
- Restock suggestions: selling speed se batata hai kaun sa item kitne din me khatam
- Expenses tab: rent, bijli, tea, marketing wagera

## 4) Dashboards
Dono dashboards par "This month's money" strip: revenue, gross profit, net profit/loss, supplier dues.

## 5) Faltu / galat cheezein jo theek ki
- Shoes me **cost price tha hi nahi** -> product form me add (margin bhi dikhta hai); sale par cost snapshot save hota hai
- Shoes sidebar me Salesmen/Suppliers links 404 the; Clothes ka Suppliers link disabled tha -> ab chalte hain
- **Security**: product/supplier/salesman by-id operations ab shop-scoped hain (pehle koi dusri shop ka data id se chhed sakta tha)
- Invoice numbers ab atomic counter se (duplicate nahi banenge); Clothes invoice per shop per din
- Shoes sale me stock validation + **Refund** (Sales History me button, stock wapas)
- Clothes sale: pehle sab stock check, phir sale save, phir stock kam (pehle beech me fail ho to stock kam reh jata tha)
- Galat/bad ID par server crash hota tha -> ab 400 error
- Purana ClothingStaff page hata kar shared StaffManager lagaya (code duplicate nahi)

## Dhyan do
- `.env` me JWT_SECRET abhi default hai — deploy se pehle lamba random string rakho.
- Atlas password chat me share hua tha — baad me change kar lena. Atlas Network Access me apna IP allow hona chahiye.
- Salary expense P&L me: jis mahine attendance mark nahi hui, wahan poori salary assume hoti hai (table me `*` se dikhta hai).
- Forecast ke liye kam az kam 2 mukammal mahino ka sales data chahiye.
