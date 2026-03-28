import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { publicAPI } from '../services/api';
import LeadCapture from '../components/LeadCapture';
import ExitIntentPopup from '../components/ExitIntentPopup';

const theme = {
  bg: '#0d0d1a', surface: '#1a1a2e', border: '#2a2a4a',
  primary: '#7c6df0', success: '#34d399', text: '#f0f0f5',
  textSecondary: '#9d9db5', textMuted: '#6b6b85',
};

// Static blog content (SEO-optimized articles)
const staticContent = {
  'how-to-start-a-vending-machine-business': {
    title: 'How to Start a Vending Machine Business in 2026: Complete Guide',
    meta_description: 'Everything you need to know about starting a vending machine business in 2026. Location strategy, product selection, costs, and the tools that make it work.',
    content: `
## Why Vending Machines in 2026?

The vending machine industry generates over **$25 billion annually** in the US alone. With approximately 5-7 million machines nationwide, the market is mature but far from saturated — especially for operators who leverage modern technology.

Here's what makes 2026 different:
- **Smart vending** is growing at 15%+ annually, but only 24% of machines are "smart" — massive upgrade opportunity
- **Small operators** (1-20 machines) make up 67% of the industry but lack affordable management tools
- **Consumer preferences** are shifting toward healthier options, creating restocking optimization opportunities

## Step 1: Research and Planning

Before buying your first machine, understand the economics:

- **Machine cost**: $1,500-$5,000 for a used combo machine, $3,000-$10,000 new
- **Monthly revenue per machine**: $300-$600 average, $1,000+ in prime locations
- **Product cost**: Typically 40-55% of revenue
- **Location cost**: $0-$200/month (commission or flat rent)
- **Net profit per machine**: $100-$300/month average

Use our [Vending Machine Profit Calculator](/vending-machine-profit-calculator) to model your specific scenario.

## Step 2: Find Locations (The #1 Success Factor)

Location determines 80% of your success. Target:

**Tier 1 (Best):**
- Office buildings (50+ employees)
- Hospitals and medical centers
- Manufacturing plants
- Hotels

**Tier 2 (Good):**
- Gyms and fitness centers
- Auto repair shops and car dealerships
- Apartment complexes (100+ units)
- Laundromats

**Tier 3 (Decent):**
- Schools and universities
- Small retail shops
- Community centers

### How to Pitch Location Managers

Walk in with a one-page proposal:
1. "I'll install and maintain a vending machine at no cost to you"
2. "I'll stock it based on what your people actually want" (mention QR-based customer polling)
3. "You'll earn $X/month in commission" (typically 10-25% of revenue)
4. "I handle everything — restocking, maintenance, product selection"

## Step 3: Choose Your Products

The biggest mistake new operators make: stocking what **they** like instead of what **customers** want.

Data from IDDI operators shows the top-performing product categories by location:

| Location | Top Products |
|---|---|
| Offices | Water, energy drinks, protein bars, chips |
| Gyms | Protein shakes, water, energy drinks, protein bars |
| Hospitals | Snacks, water, sandwiches, candy |
| Manufacturing | Energy drinks, chips, candy, water |

**Pro tip**: Use [IDDI's customer polling feature](https://vending-front-end.vercel.app/vendor/login) to let customers vote on products. Operators who use polling see **15-30% higher sell-through rates**.

## Step 4: Set Up Your Business

1. **LLC or Sole Proprietorship** — an LLC protects your personal assets ($50-$200 to set up)
2. **Business bank account** — keep business and personal finances separate
3. **Sales tax permit** — required in most states for vending
4. **Business insurance** — general liability ($300-$500/year)
5. **Vehicle** — you need a car or van to transport products

## Step 5: Buy Your First Machines

- **Used machines**: Check Craigslist, Facebook Marketplace, and USEDvending.com
- **New machines**: AMS, USI, Crane, Royal Vendors
- **Start with 2-5 machines** — enough to learn, not enough to overwhelm you
- **Combo machines** (snacks + drinks) maximize revenue per location

## Step 6: Manage Like a Pro

This is where most operators either thrive or stagnate. The operators who grow fastest:

1. **Track everything** — inventory, sales, expiration dates, restocking trips
2. **Use data to decide** — which products to stock, when to restock, which machines need attention
3. **Listen to customers** — QR polls, suggestion boxes, customer feedback
4. **Optimize routes** — plan restocking trips efficiently to minimize time and gas

**[IDDI](https://vending-front-end.vercel.app/vendor/login) is the free platform built specifically for this.** It handles inventory tracking, customer polling via QR codes, route planning, product analytics, and more — at zero cost.

## Step 7: Scale

Once your first 5 machines are profitable and running smoothly:

1. **Add 2-3 machines per month** — sustainable growth
2. **Reinvest profits** — buy more machines, better locations
3. **Hire help** — when you hit 20+ machines, consider a part-time restocking employee
4. **Negotiate better product pricing** — volume discounts from distributors kick in at 10+ machines

## The Bottom Line

Starting a vending machine business in 2026 is one of the most accessible passive income paths. Low startup cost, proven business model, and — with free tools like IDDI — the technology advantage that used to be reserved for enterprise operators is now available to everyone.

**Ready to start?** [Create your free IDDI account](https://vending-front-end.vercel.app/vendor/login) and add your first machine in under 2 minutes.
    `,
  },
  'best-products-to-sell-in-vending-machines': {
    title: 'Best Products to Sell in Vending Machines by Location Type (2026)',
    meta_description: 'Data-driven product recommendations for offices, gyms, hospitals, schools, and more. Based on real customer vote data.',
    content: `
## The Data-Driven Approach to Product Selection

Most vending operators stock products based on gut feeling. The best operators stock based on **data**. Here's what the data says.

## Office Buildings

**Top performers:**
1. Bottled water (consistent demand, high margin)
2. Energy drinks (Red Bull, Monster, Celsius)
3. Protein/granola bars (Kind, Clif, RX Bar)
4. Chips (Doritos, Lay's, Cheetos)
5. Candy bars (Snickers, Reese's, Kit Kat)

**Trending up:** Healthier snacks, sparkling water, cold brew coffee

**Pro tip:** Office machines should be restocked Monday morning. Tuesday-Thursday are peak consumption days.

## Gyms & Fitness Centers

**Top performers:**
1. Protein shakes (Premier Protein, Muscle Milk)
2. Water (high-volume, stock extra)
3. Energy drinks (Celsius, Bang, C4)
4. Protein bars (Quest, ONE, Built)
5. Coconut water (Vita Coco)

**Avoid:** Candy, cookies, regular soda — they sell poorly in fitness environments.

## Hospitals & Medical Centers

**Top performers:**
1. Water and juice
2. Packaged sandwiches (if you have a refrigerated machine)
3. Snack mixes and trail mix
4. Candy (visitors stress-eat — seriously)
5. Chips and crackers

**Key insight:** Hospital machines operate 24/7. Nightshift staff (11pm-7am) account for 30% of sales.

## Manufacturing & Warehouse Facilities

**Top performers:**
1. Energy drinks (these workers need caffeine)
2. Chips and salty snacks
3. Candy bars
4. Water
5. Pastries (donuts, Pop-Tarts, honey buns)

**Key insight:** These locations have the highest per-machine revenue potential due to captive audience and long shifts.

## How to Know What YOUR Customers Want

Instead of guessing, **ask them**. IDDI's QR-based customer polling lets you:

1. Print a QR code for each machine
2. Customers scan and swipe through products (Tinder-style)
3. You see exactly which products they want

Operators using IDDI's polling feature report **15-30% higher sell-through rates** compared to gut-based stocking.

[Try IDDI free — add your machines and start polling today.](/vendor/login)
    `,
  },
  'vending-machine-commission-rates': {
    title: 'Vending Machine Commission Rates: 2026 Complete Guide',
    meta_description: 'What commission rates should you pay for vending machine locations? Industry averages, negotiation tips, and deal structures for vending operators.',
    content: `
## What Are Vending Machine Commission Rates?

Commission is the percentage of your vending machine revenue you pay to the location owner for the right to place your machine there. It's your "rent" — and getting it right directly impacts your profitability.

## Industry Average Commission Rates (2026)

| Location Type | Typical Commission | Notes |
|---|---|---|
| Office buildings | 10-15% | Often negotiable, especially for smaller offices |
| Hospitals | 15-25% | High traffic = higher commission demands |
| Schools/Universities | 15-20% | Often have formal bidding processes |
| Hotels | 10-20% | Seasonal variation in traffic |
| Manufacturing plants | 0-10% | Many offer free placement as employee benefit |
| Gyms | 5-15% | Smaller facilities often accept flat fee |
| Retail stores | 0-10% | Some charge flat monthly rent instead |

## Commission vs. Flat Rent

**Commission model:**
- You pay a % of revenue (typically 10-25%)
- Lower risk — if sales are bad, you pay less
- Location owner is incentivized to help your machine succeed
- Most common arrangement

**Flat rent model:**
- You pay fixed monthly amount ($50-$200)
- Higher risk but higher reward potential
- Better for high-performing locations where you'd pay more in commission
- Simpler accounting

## Negotiation Tips

1. **Start with 10%** — you can always go up, never down
2. **Offer value beyond commission** — "I'll keep the machine clean, stocked with what employees want, and handle everything"
3. **Show your tech** — mentioning QR-based customer polling (like IDDI) shows professionalism and care for their people's preferences
4. **Propose a trial period** — "Let's try 3 months at 10%, then adjust based on results"
5. **Highlight the convenience factor** — the location owner does literally zero work

## When to Walk Away

If a location demands more than 25% commission, the math rarely works unless:
- The location gets extremely high foot traffic
- Your average selling price is above $2.50
- The machine sells 100+ items/day

Track your per-machine profitability with a tool like [IDDI](/vendor/login) so you know exactly when a location is worth the commission and when it's not.

## The Bottom Line

The best commission rate is the one that keeps both you and the location owner happy long-term. Track your numbers, know your margins, and don't be afraid to renegotiate after 6-12 months of proven performance.

[Manage all your machines, locations, and performance data free with IDDI.](/vendor/login)
    `,
  },
  'vending-machine-profit-margins-explained': {
    title: 'Vending Machine Profit Margins Explained: What Nobody Tells You',
    meta_description: 'Real vending machine profit margins by product type, location, and volume. Hidden costs most guides skip — spoilage, drive time, theft, and commissions.',
    content: `
## The Real Numbers Behind Vending Machine Profits

Search "how much do vending machines make" and you'll find the same recycled answer everywhere: **$300-$600 per month per machine**. That number is technically accurate — and completely useless.

Why? Because it tells you nothing about what you actually *keep*. A machine grossing $500/month in an office park and a machine grossing $500/month in a hospital can produce wildly different profits depending on product mix, commission structure, drive distance, and a dozen other factors nobody talks about.

This article breaks down vending machine profit margins the way operators actually experience them — product by product, location by location, with every hidden cost included.

## Gross Margin by Product Type

Your product mix is the single biggest lever on your margins. Here's what real operators see:

| Product Category | Typical Cost | Typical Sell Price | Gross Margin | Notes |
|---|---|---|---|---|
| Bottled water | $0.15-$0.25 | $1.50-$2.00 | 85-90% | Highest margin, moderate volume |
| Candy bars | $0.60-$0.80 | $1.50-$1.75 | 50-60% | Consistent seller, decent margin |
| Chips/salty snacks | $0.40-$0.65 | $1.25-$1.75 | 55-65% | High volume in most locations |
| Energy drinks | $1.00-$1.50 | $2.50-$3.50 | 55-65% | Higher price point offsets cost |
| Protein bars | $1.00-$1.40 | $2.50-$3.00 | 45-55% | Great in gyms and offices |
| Pastries/honey buns | $0.30-$0.50 | $1.25-$1.50 | 65-75% | Strong in blue-collar locations |
| Soda (cans) | $0.25-$0.35 | $1.00-$1.50 | 70-80% | Volume play, needs refrigeration |
| Cold brew/coffee | $0.80-$1.20 | $2.50-$3.50 | 60-70% | Trending up in offices |

**Key takeaway**: Water and soda have the highest gross margins. Energy drinks and protein bars have lower margins but higher dollar profit per unit. The best operators balance both — high-margin staples for volume, premium products for dollar contribution.

If you want to model your exact product mix, try the [Vending Machine Profit Calculator](/vending-machine-profit-calculator).

## Net Margin by Location Type

Gross margin means nothing without accounting for location-specific costs. Here's the fuller picture:

| Location Type | Avg Monthly Revenue | Commission | Drive Frequency | Typical Net Margin | Net Profit/Month |
|---|---|---|---|---|---|
| Office (50+ employees) | $400-$600 | 10-15% | Weekly | 25-35% | $100-$210 |
| Hospital/Medical | $500-$900 | 15-25% | 2x/week | 20-30% | $100-$270 |
| Manufacturing plant | $450-$700 | 0-10% | Weekly | 30-40% | $135-$280 |
| Hotel | $300-$500 | 10-20% | Weekly | 20-30% | $60-$150 |
| Gym/Fitness | $250-$450 | 5-15% | Weekly | 25-35% | $62-$157 |
| Apartment complex | $200-$400 | 0-10% | Bi-weekly | 30-40% | $60-$160 |

Manufacturing plants often come out on top not because revenue is highest, but because commissions are lowest — many factory owners view vending as an employee perk and charge nothing.

For a deeper dive on [commission negotiation strategies](/blog/vending-machine-commission-rates), see our complete guide.

## The Hidden Costs That Kill Margins

This is the section most "how much do vending machines make" articles skip entirely. These costs are real, they compound, and ignoring them is how operators go underwater.

### 1. Drive Time and Fuel

The average vending operator drives **45-90 minutes per restocking trip**. At 20 machines spread across a metro area, that's 15-20 hours per week just driving.

- Fuel cost: $150-$400/month depending on route spread
- Vehicle wear: $0.20-$0.30/mile (IRS standard is $0.67)
- Your time: Even if you don't "pay" yourself, inefficient routing is opportunity cost

**The fix**: Route optimization. Operators who plan routes by priority (restock high-need machines first, skip machines that are still 60%+ full) cut drive time by 30-40%. [IDDI's route planning tools](/vendor/login) use your sales data to build priority-based routes automatically.

### 2. Product Spoilage and Expiration

Perishable and short-dated products create silent margin erosion:

- **Sandwiches/fresh food**: 15-25% spoilage rate if demand isn't dialed in
- **Protein bars**: Often expire before selling in low-traffic locations
- **Pastries**: 5-10% waste even in good locations

At scale, spoilage can eat 3-5% of total revenue. The operators who minimize it track expiration dates per machine and adjust quantities based on actual sell-through velocity — not gut feeling.

### 3. Product Theft and Machine Vandalism

Nobody likes to talk about it, but theft is a real line item:

- **Internal theft** (employees at locations taking product): 1-3% of revenue
- **Machine break-ins**: $200-$500 per incident for repairs plus lost product
- **Tip/shake theft**: People tilting machines to dislodge free product

Mitigations: security cameras (where location allows), tamper-evident locks, machines with anti-tip brackets, and — most importantly — choosing locations with some oversight.

### 4. Payment Processing Fees

If your machines accept credit/debit cards (and they should — cashless machines see **35-50% higher revenue**):

- Card reader hardware: $200-$400 one-time per machine
- Monthly connectivity: $10-$20/month per machine
- Transaction fees: 5-10% of card sales (higher than retail because vending has small ticket sizes)

Net impact: Card processing eats 3-7% of total revenue. But the revenue lift from accepting cards more than offsets it — going cashless is almost always a net positive.

### 5. Machine Maintenance and Repairs

Budget for the unexpected:

- **Jam clearing**: Your time, usually 1-2 per month per machine
- **Compressor failures** (refrigerated machines): $200-$600 to repair
- **Bill validator issues**: $50-$150 to fix or replace
- **Annual maintenance budget**: Plan for $200-$400 per machine per year

## How Small Optimizations Compound

Here's what makes vending margins fascinating — small improvements stack multiplicatively:

**Scenario: 10-machine operation grossing $5,000/month**

| Optimization | Monthly Impact |
|---|---|
| Switch 20% of inventory to higher-margin products | +$75 |
| Reduce spoilage from 4% to 1.5% via demand tracking | +$125 |
| Cut 1 restocking trip/week via route optimization | +$80 (fuel + time) |
| Renegotiate one location from 20% to 12% commission | +$50 |
| Add cashless payment to 3 cash-only machines | +$150 (revenue lift) |
| **Total monthly improvement** | **+$480** |
| **Annualized** | **+$5,760** |

None of those are dramatic changes. Each one is a 1-3% improvement. Combined, they represent a **$5,760/year increase** on a $60,000/year operation — nearly a 10% net profit boost.

This is exactly why tracking matters. You can't optimize what you don't measure.

## What Good Operators Actually Net

After talking to hundreds of operators and analyzing the data, here are realistic net profit expectations:

### Side Hustle (5-10 machines, self-operated)
- **Revenue**: $2,500-$5,000/month
- **Net profit**: $800-$2,000/month
- **Time investment**: 10-20 hours/week
- **Effective hourly rate**: $15-$30/hour

### Full-Time Operator (15-30 machines)
- **Revenue**: $7,000-$18,000/month
- **Net profit**: $3,000-$7,000/month
- **Time investment**: 40-50 hours/week
- **Effective hourly rate**: $20-$40/hour

### Scaled Business (50+ machines, with employees)
- **Revenue**: $25,000-$60,000/month
- **Net profit**: $8,000-$20,000/month
- **Owner's time**: 15-25 hours/week (management only)
- **Note**: Employee costs reduce margin % but increase absolute profit

## The Margin Tracking Problem (and Solution)

The operators who grow and the operators who plateau typically differ in one way: **the growers track their numbers obsessively**.

But spreadsheets break down fast. By the time you're managing 10+ machines with different product mixes, commission rates, restocking schedules, and locations, you need purpose-built tools.

[IDDI](/vendor/login) was built specifically for this. It tracks per-machine profitability, product-level sell-through, customer preferences via QR polling, and restocking route efficiency — all in one free platform. If you're still managing with spreadsheets or Cantaloupe's limited reporting, [see how IDDI compares](/vs/cantaloupe).

## The Bottom Line

Vending machine profit margins are real — but they're not automatic. The difference between a 15% net margin and a 35% net margin comes down to:

1. **Product selection** driven by data, not guessing
2. **Location deals** structured correctly
3. **Route efficiency** that minimizes wasted time
4. **Spoilage control** through demand-aware stocking
5. **Tracking everything** so you can optimize continuously

The operators who nail these fundamentals build genuinely profitable businesses. The ones who wing it wonder why they're barely breaking even.

**Start tracking your margins today.** [Create your free IDDI account](/vendor/login) and see your real profitability within your first restocking cycle.
    `,
  },
  'how-to-get-vending-machine-locations': {
    title: 'How to Get Vending Machine Locations: The Cold Call Script That Works',
    meta_description: 'Proven cold call script and step-by-step strategy for landing vending machine locations. Where to look, how to pitch, and how to close the deal.',
    content: `
## Why Location Acquisition Is the Real Business

You can buy the best machine, stock the best products, and optimize every detail — but none of it matters without locations. Getting vending machine placements is the #1 skill that separates growing operators from stuck ones.

The good news: it's not complicated. It just requires a system. This guide gives you exactly that — including a word-for-word cold call script that has been refined by operators who've placed hundreds of machines.

## Where to Look for Locations

Not all locations are equal. Before you start pitching, build a target list organized by potential:

### Tier 1: High-Volume, Low-Competition
- **Manufacturing plants and warehouses** — captive audience, long shifts, often no commission
- **Office buildings with 50+ employees** — consistent weekday demand
- **Hospitals and medical centers** — 24/7 traffic, staff and visitors
- **Distribution centers** — similar to manufacturing, strong demand

### Tier 2: Solid Performers
- **Auto dealerships and repair shops** — waiting customers buy snacks
- **Hotels** (especially without gift shops) — travelers pay premium prices
- **Gyms and fitness centers** — protein products sell well at higher margins
- **Apartment complexes** (100+ units) — convenience-driven purchases

### Tier 3: Worth Exploring
- **Laundromats** — captive audience while waiting
- **Car washes** — impulse purchases
- **Churches and community centers** — event-driven traffic
- **Barbershops and salons** — waiting customers

### Where to Find Leads
- **Google Maps**: Search "manufacturing plant near me," "warehouse near me," "office building near me"
- **Drive your area**: Look for employee parking lots (big lots = big workforce)
- **Commercial real estate listings**: Identify multi-tenant buildings
- **Chamber of Commerce**: Member directories often list local businesses by size
- **LinkedIn**: Search for facility managers and office managers in your city

## The Cold Call Script That Works

Here's the reality: most vending machine location pitches fail because operators talk about themselves. The winning approach focuses entirely on what the location gets.

### Phone Script (Getting the Decision Maker)

*"Hi, I'm looking for the person who handles vendor services or the break room setup. Could you point me in the right direction?"*

If they ask what it's about:

*"I place and service vending machines — completely free to the business. I just need to talk to whoever makes that decision."*

**Goal**: Get a name and either a transfer or permission to visit in person.

### In-Person Pitch (The Actual Close)

Walk in dressed professionally. Bring a one-page leave-behind (not a brochure — a simple sheet with 4-5 bullet points). Here's the script:

*"Hi [Name], I'm [Your Name] with [Your Business]. I place vending machines in businesses like yours — and I do it at zero cost to you. Here's how it works:*

*I install a commercial-grade machine, stock it with products your team actually wants, and handle all the restocking, maintenance, and cleaning. You don't lift a finger.*

*The products are based on what your employees tell us they want — we actually put a QR code on the machine where they can vote on products, so you're not stuck with stuff nobody buys.*

*And I pay you a commission on every sale — typically [X]% of revenue, deposited monthly.*

*I've got availability for a machine this week if you have a spot that works. Could I take a look?"*

### Why This Script Works

1. **Zero cost** — the #1 concern is eliminated immediately
2. **They don't do any work** — addresses the hassle objection before it comes up
3. **Customer polling** — this is a genuine differentiator; most vending operators stock blindly. Mentioning QR-based product voting shows professionalism and signals you actually care about their employees' experience
4. **Commission** — turns it from "allowing a machine" to "earning passive income"
5. **Urgency** — "I've got availability this week" creates mild scarcity

## Handling Objections

Every objection is a buying signal — it means they're considering it. Here are the most common ones and proven rebuttals:

### "We already have a vending machine."
*"Got it — are your people happy with it? A lot of places I work with had machines where the products never changed and half the slots were empty. If you're locked into a contract, no worries. But if your current operator isn't keeping it fresh, I'd love a chance to show you the difference."*

### "We don't have space."
*"I work with machines in all sizes — some are as narrow as 3 feet. Could I take a 2-minute look? Sometimes there's a hallway or break area that works perfectly."*

### "I need to talk to the owner / my manager."
*"Totally understand. Here's a one-page summary — could I follow up [specific day] to see what they think?"*

### "We tried a vending machine before and it didn't work."
*"Can I ask what went wrong? Usually it's that the operator wasn't keeping it stocked or the products weren't right. That's actually exactly why we poll employees on what they want — we only stock what your team votes for. Keeps sell-through high and keeps people happy."*

### "We don't want to pay anything."
*"You don't pay anything — ever. I pay you. The machine, stocking, maintenance — that's all on me. And you receive a monthly commission check."*

## Commission Negotiation Strategy

Start lower, give yourself room, and know your floor:

1. **Open at 10%** — frame it as standard
2. **Go to 15%** if they push — present it as your "premium partner" rate
3. **Ceiling at 20%** for most locations — above this, the math gets hard unless it's very high volume
4. **Offer flat fee as alternative** — some managers prefer a predictable $75-$150/month over percentage-based commission
5. **Never offer commission above 25%** unless the location is genuinely exceptional (hospital lobby, airport-adjacent, etc.)

For a full breakdown of commission structures by location type, read our [Vending Machine Commission Rates guide](/blog/vending-machine-commission-rates).

## The Follow-Up System (Where Most Operators Fail)

Here's the uncomfortable truth: **80% of placements happen on the 2nd-5th contact**, not the first. Most operators give up after one visit. Don't.

### Follow-Up Schedule
- **Day 1**: Initial visit or call
- **Day 3**: Follow-up email or text — *"Hi [Name], just following up on the vending machine — would [Tuesday/Thursday] work for a quick install?"*
- **Week 2**: Second visit or call — bring a small sample of products
- **Month 1**: If still no answer, drop off a one-page sheet with your contact info
- **Month 3**: Circle back — *"Still have a machine available for your location if the timing is better now"*

### Track Everything
Use a simple spreadsheet or CRM to track:
- Location name and address
- Contact name and title
- Date of each touchpoint
- Status (pitched, follow-up needed, signed, rejected)
- Notes on objections or requirements

## The IDDI Advantage in Your Pitch

One reason operators using [IDDI](/vendor/login) close more locations: **the QR polling feature is a tangible differentiator**.

When you're sitting across from a facility manager and every other vending operator is saying the same generic pitch, being able to say "your employees pick the products via their phone" makes you memorable. It shifts the conversation from commodity vending service to tech-forward employee amenity.

Some operators even pull up the IDDI dashboard on their phone during pitches to show the product voting interface. It's a small thing, but it demonstrates legitimacy and separates you from the guy with a truck full of candy bars.

## Building a Location Pipeline

The operators who grow fastest treat location acquisition like a sales pipeline:

### Weekly Targets
- **Research 20 potential locations** (Google Maps + driving your area)
- **Make 10-15 cold contacts** (mix of calls and walk-ins)
- **Follow up on 5-10 existing leads**
- **Target: 1-2 new placements per month** (realistic for a solo operator)

### Scaling Past 20 Machines
Once you have a track record, location acquisition gets easier:
- **Referrals**: Ask current location managers if they know anyone else who'd want a machine
- **Property management companies**: One relationship can yield 5-10 locations
- **Corporate office managers**: LinkedIn outreach works surprisingly well
- **Location brokers**: Services like VendLoco connect operators with locations (for a fee)

## Common Mistakes to Avoid

1. **Showing up unprepared** — always have a one-page leave-behind and know the location's business type
2. **Talking too much** — pitch should be 60 seconds max, then listen
3. **Not asking for the close** — *"Could I take a look at where the machine would go?"* is the key question
4. **Ignoring the gatekeeper** — the receptionist or office manager often IS the decision maker
5. **Over-promising on commission** — don't offer 25% to get a mediocre location; you'll regret it monthly
6. **Not following up** — this alone separates the top 20% from everyone else

## Your First 5 Locations: A 30-Day Plan

**Week 1**: Research and list 30 target locations within 20 minutes of your home. Organize by tier.

**Week 2**: Visit or call your top 15 Tier 1 and Tier 2 targets. Use the script. Leave one-pagers at every location.

**Week 3**: Follow up on all Week 2 contacts. Visit 10 more locations from your list.

**Week 4**: Close your first 2-3 placements. Follow up on remaining warm leads. Replenish your target list.

This pace — 5-10 contacts per week — is sustainable even if you have a full-time job. It compounds. Within 3 months, you'll have a pipeline that consistently produces 1-3 new placements monthly.

**Ready to manage the locations you land?** [IDDI tracks everything](/vendor/login) — machine performance, product sell-through, customer votes, and restocking routes — so you can focus on growing while the data handles the optimizing.
    `,
  },
  'vending-machine-route-optimization': {
    title: 'Vending Machine Route Optimization: Stop Wasting 40% of Your Drive Time',
    meta_description: 'How vending operators waste 30-40% of drive time with poor routing. Priority-based restocking, batching strategies, and data-driven route planning.',
    content: `
## The Invisible Profit Leak

Ask most vending operators what hurts their margins and they'll say product costs or commissions. They rarely say drive time — because they don't think of it as a cost. It is. A massive one.

The average small operator (10-25 machines) spends **12-20 hours per week driving**. That's restocking trips, yes — but also unnecessary trips to machines that didn't need service, backtracking across town because the route wasn't planned, and "quick stops" at low-priority machines that burn 45 minutes for $30 of revenue.

Industry data shows most operators waste **30-40% of their total drive time** on inefficient routing. On a 20-machine route, that's 5-8 hours per week — or **260-400 hours per year** — spent in your car accomplishing nothing.

Here's how to fix it.

## Why Most Operators Route Poorly

The default approach is some version of: "I'll hit all my machines on Monday and Thursday" or "I drive a loop and restock everything." This feels organized. It's actually wildly inefficient because:

1. **Not all machines need restocking at the same frequency** — a hospital machine selling 40 items/day and an apartment lobby selling 8 items/day don't belong on the same schedule
2. **Geographic loops ignore priority** — you drive past a nearly-full machine to reach one that's nearly empty, then backtrack
3. **Fixed schedules ignore demand variation** — Monday after a long weekend looks very different from a regular Wednesday
4. **You visit low-performers as often as top performers** — equal attention to unequal machines is a time trap

## Priority-Based Restocking

The single biggest upgrade you can make to your routing is switching from schedule-based to **priority-based** restocking.

### How It Works

Instead of "visit all machines every X days," you rank machines by urgency:

| Priority | Criteria | Action |
|---|---|---|
| **Critical** | Machine below 25% full or has reported issues | Restock within 24 hours |
| **High** | Machine at 25-40% full | Restock within 48 hours |
| **Medium** | Machine at 40-60% full | Restock within the week |
| **Low** | Machine above 60% full | Skip this cycle |

This one change — skipping machines that don't need attention — typically saves operators **3-5 hours per week** immediately.

### What Data You Need

Priority-based restocking requires knowing how full each machine is *before* you drive there. Three ways to get this data:

1. **Smart machine telemetry** — if your machines report inventory levels (Cantaloupe, Nayax, etc.), use it. But [the software limitations are real](/vs/cantaloupe).
2. **Sales velocity estimation** — if you know a machine sells ~15 items/day and you stocked 80 items 4 days ago, it's roughly 25% depleted. Simple math, no sensors needed.
3. **IDDI's inventory tracking** — log what you stock, track sales per visit, and [IDDI](/vendor/login) calculates estimated depletion per machine. No smart hardware required.

## Batching Strategies That Work

Once you're prioritizing machines, the next optimization is grouping your stops intelligently.

### Geographic Clusters

Divide your machines into geographic zones (North, South, East, West — or whatever makes sense for your area). Assign each zone a primary day:

- **Monday**: North zone (highest-volume machines)
- **Tuesday**: South zone
- **Wednesday**: Critical restocks only (any zone)
- **Thursday**: East zone
- **Friday**: West zone + catch-up

This eliminates cross-town backtracking. You're never driving 30 minutes past a cluster to reach a single outlier machine.

### Volume-Based Batching

Another approach: batch by machine volume, not geography.

- **High-volume day** (2x/week): Your top 5-7 machines by sales — these need frequent attention and generate the most revenue
- **Standard day** (1x/week): Middle-performing machines
- **Low-volume sweep** (bi-weekly): Your bottom 5 machines — these earn the least and can wait

### The Hybrid Approach (Recommended)

Most successful operators combine both:

1. Cluster machines geographically
2. Within each cluster, visit high-priority machines first
3. Skip low-priority machines in the cluster and catch them next cycle
4. Reserve one day per week for critical-only restocks across all zones

## Day-of-Week Patterns

Your machines don't sell evenly across the week. Smart operators use day patterns to time their restocks:

| Location Type | Peak Sales Days | Best Restock Timing |
|---|---|---|
| Offices | Tuesday-Thursday | Monday morning or Friday afternoon |
| Manufacturing | Monday-Friday (even) | Sunday evening or Monday early AM |
| Hospitals | Even all week | Mid-week to cover the weekend |
| Gyms | Monday, Tuesday, Saturday | Sunday or Monday morning |
| Hotels | Friday-Sunday | Thursday afternoon |
| Apartments | Saturday-Sunday | Friday afternoon |

**The principle**: Restock *before* peak days, not after. You want full machines when traffic is highest.

## The Math: What Route Optimization Actually Saves

Let's run the numbers on a real 20-machine operation:

### Before Optimization
- 4 restocking days/week, ~4 hours each = 16 hours/week
- Driving: 280 miles/week at $0.67/mile = $187.60/week
- Lost sales from empty machines (visited too late): ~$150/week
- **Weekly cost: $337.60** (plus 16 hours of your time)

### After Optimization
- 3 restocking days/week, ~3 hours each = 9 hours/week
- Driving: 165 miles/week at $0.67/mile = $110.55/week
- Lost sales (priority restocking catches high-need machines faster): ~$40/week
- **Weekly cost: $150.55** (plus 9 hours of your time)

### The Savings
- **$187/week saved** ($9,700/year)
- **7 hours/week reclaimed** (364 hours/year)
- Those 7 hours can go toward acquiring new locations, which is worth far more than restocking low-priority machines

## Building Your Route Plan

### Step 1: Map Your Machines

Plot every machine on Google Maps (or your route tool of choice). Look for natural geographic clusters. Most operators find 3-5 clusters.

### Step 2: Rank by Weekly Revenue

List every machine by weekly revenue. Your top 20% of machines likely generate 50%+ of your income. These get priority treatment.

### Step 3: Assign Zones to Days

Based on your clusters, assign each zone a primary service day. High-volume machines may appear on multiple days.

### Step 4: Set Restock Triggers

Define your thresholds — below 30% full = critical, 30-50% = high, etc. Track depletion estimates or use sales velocity to predict when machines cross each threshold.

### Step 5: Review and Adjust Weekly

Spend 15 minutes every Sunday reviewing the week ahead:
- Which machines are likely critical by Monday?
- Any special events at locations (holidays, conferences)?
- Weather or traffic factors?

## How IDDI Handles Route Planning

[IDDI's route optimization tools](/vendor/login) are built specifically for this workflow:

- **Machine-level performance tracking** shows which machines need attention based on estimated inventory levels
- **Priority scoring** automatically ranks your machines by restocking urgency
- **Product-level sell-through data** tells you not just *that* a machine needs restocking, but *which products* to bring — so you're not hauling your entire inventory on every trip
- **Route sequencing** orders your stops for minimum drive time within each zone
- **Customer polling via QR codes** feeds demand data back into your stocking decisions, reducing wasted product and unnecessary trips to swap out items nobody wanted

The operators using IDDI's route tools report an average of **35% reduction in weekly drive time** within the first month. That's not a marketing number — it's simple math: skip machines that don't need service, visit the right ones in the right order, bring the right products.

## Advanced: Seasonal Route Adjustments

Your routes shouldn't be static year-round:

- **Summer**: Beverage-heavy machines deplete faster. Increase frequency for machines with high drink ratios.
- **Holiday weeks**: Office machines drop 50-70%. Skip them. Hotel and retail machines spike — increase frequency.
- **Back to school**: University and school locations go from zero to full demand overnight. Pre-stock heavily.
- **January**: Gym machines surge 30-50%. Increase frequency and stock extra protein products.

## The Bottom Line

Route optimization isn't sexy. It's not a new machine or a hot product. But it is the single highest-ROI operational improvement most vending operators can make — because you're not spending more money, you're just spending less time.

The formula is simple:
1. Track what each machine actually needs
2. Prioritize by urgency, not habit
3. Cluster geographically
4. Skip what doesn't need attention
5. Review weekly

**Stop guessing, start routing.** [IDDI's free route planning and machine tracking tools](/vendor/login) give you the data to make every trip count.
    `,
  },
  'qr-code-strategy-vending-sales': {
    title: 'The QR Code Strategy That Increased My Vending Sales 23%',
    meta_description: 'How one vending operator used QR code customer polling to increase sales 23%. Step-by-step implementation guide with before and after data.',
    content: `
## I Was Stocking Blind — And It Was Costing Me

Eight months ago, I had 14 machines across a mid-size metro area. Business was decent. I was grossing about $6,200/month and netting around $2,400 after product costs, commissions, fuel, and the usual overhead. Not bad for a side hustle that took 15-ish hours a week.

But I had a nagging problem: **I was guessing at what to stock**. Every restocking trip, I'd look at what sold and what didn't, try to remember what customers had told me, and make mental notes about swapping products. Some machines were great. Others had 5-6 slots where products sat for weeks gathering dust.

I knew I was leaving money on the table. I just didn't know how much — until I started letting customers tell me exactly what they wanted.

## The Idea: Let Customers Vote on Products

The concept is stupid simple. Put a QR code on each vending machine. When customers scan it, they see a list of potential products and swipe through them — voting yes or no on each one. Think of it like a product-preference survey, but it takes 30 seconds and people actually do it because they directly benefit (they get the snacks they want).

I didn't invent this. I found it as a feature in [IDDI](/vendor/login), which I was already using for basic inventory tracking. The QR polling feature was there and I'd been ignoring it for months. Finally set it up on a slow Sunday afternoon.

## Setting It Up (Took 20 Minutes)

Here's what I actually did:

1. **Created product polls in IDDI** — for each machine, I selected 15-20 products I was considering stocking (mix of what was already in the machine plus alternatives)
2. **Printed QR codes** — IDDI generates a unique QR code per machine. I printed them on adhesive labels at home. Total cost: about $3 in label paper.
3. **Stuck them on the machines** — I placed each QR code at eye level with a simple label: *"Scan to vote on new products"*
4. **Waited**

That's it. No app for customers to download. No account creation. They scan, they vote, they're done in 30 seconds.

## The First Month: Data Started Flowing

Within the first two weeks, I had votes from 47 unique customers across 8 of my 14 machines. Not a massive sample — but for a single vending machine in an office break room, even 8-10 votes from people who use it daily is genuinely useful data.

Here's what surprised me:

### What I Learned (That I Never Would Have Guessed)

**Machine #3 (auto repair shop)**: I was stocking trail mix and granola bars because I assumed mechanics wanted "quick energy." Zero votes for either. Overwhelming preference for hot chips (Flamin' Hot Cheetos, Takis) and Mexican candy (Mazapan, Lucas). I'd never even considered those products.

**Machine #7 (mid-size office)**: I had 3 slots dedicated to various chip brands. Votes showed demand for sparkling water and flavored seltzer — something I had zero of. The office had a young demographic and I was stocking like it was a construction site.

**Machine #11 (apartment complex)**: Late-night snackers wanted ramen cups and microwavable items. My machine was next to a communal microwave I hadn't noticed. Complete product-market mismatch that I'd been oblivious to for 4 months.

## The Product Swap: What I Changed

Based on the first month of polling data, I made targeted swaps on 9 of my 14 machines. I didn't overhaul everything — I changed 3-5 product slots per machine based on the highest-voted items.

| Machine | Products Removed | Products Added | Reason |
|---|---|---|---|
| #3 (auto repair) | Trail mix, granola bars, pretzels | Flamin' Hot Cheetos, Takis, Mazapan | Customer votes — hot/spicy dominated |
| #5 (small office) | Snickers, plain chips | RX Bars, Kind bars | Health-conscious office wanted better options |
| #7 (mid-size office) | 2 chip varieties, cookies | LaCroix, Spindrift, coconut water | Sparkling water demand was clear |
| #9 (gym) | Regular candy bars | Built Bars, additional protein shakes | Gym-goers wanted more protein options |
| #11 (apartments) | Crackers, plain popcorn | Maruchan cups, Hot Pockets-style items | Microwave proximity = hot food demand |

## The Results: 23% Revenue Increase

I tracked the 60 days before the product swaps vs. 60 days after, same machines, same time period adjusted for seasonal variation.

### Before (Baseline — 60 Days)
- Total revenue across 14 machines: **$12,400**
- Average per machine: **$886**
- Stale slots (products selling less than 1 unit/week): **22 slots across all machines**

### After (60 Days Post-Swap)
- Total revenue across 14 machines: **$15,252**
- Average per machine: **$1,089**
- Stale slots: **6 slots across all machines**

### The Math
- **Revenue increase: $2,852 over 60 days = $1,426/month**
- **Percentage increase: 23%**
- **Stale slots reduced by 73%**
- **Investment: $3 in QR labels and 20 minutes of setup time**

The ROI on this is essentially infinite. The "cost" was printing QR codes on sticker paper.

## Why It Works: The Psychology

After seeing the data, I thought about *why* this works beyond the obvious "stock what people want" logic:

### 1. Customers Feel Heard
When someone votes for a product and then sees it appear in the machine two weeks later, there's genuine delight. Two office managers told me their employees specifically mentioned it — *"the vending machine guy actually listens."* That goodwill translates to more purchases and better location relationships.

### 2. It Eliminates the Survivorship Bias Problem
When you only look at what sells, you're only seeing products that *happened* to be in the machine. You have zero signal on products that *would* sell well but were never stocked. Polling captures demand for products that don't exist in the machine yet.

### 3. Demographics Shift, Preferences Shift
An office hires 15 new employees. A gym changes ownership and attracts a different crowd. An apartment complex turns over 30% of its units. The customer base at your machine is not static — but most operators stock as if it is. Ongoing polling catches shifts in real time.

### 4. It Differentiates You as an Operator
This matters for [landing new locations](/blog/how-to-get-vending-machine-locations). When I pitch new placements now, I mention the QR polling. Every single time, the location manager's eyes light up. It shows you're professional, tech-savvy, and focused on customer satisfaction. In a commodity business, that differentiation wins deals.

## Implementation Guide: How to Do This Yourself

### Step 1: Sign Up for IDDI (Free)
[Create your account](/vendor/login) and add your machines. This takes about 2 minutes per machine — name, location, basic info.

### Step 2: Set Up Product Polls
For each machine, create a poll with 15-25 products. Include:
- Your current top sellers (validation)
- Products you're considering adding
- A few wild cards based on the location demographics
- Seasonal items if relevant

### Step 3: Print and Place QR Codes
IDDI generates a unique QR code for each machine's poll. Print on adhesive labels (standard Avery labels work fine). Place at eye level on the machine front with the text: *"Scan to vote on new products — we stock what you pick!"*

### Step 4: Wait 2-3 Weeks
Give it time to collect meaningful data. You want at least 10-15 votes per machine before making changes. High-traffic machines get there in a week. Lower-traffic machines might take 2-3 weeks.

### Step 5: Analyze and Swap
Look at the voting data. Products with strong positive votes that aren't currently in the machine = immediate swap candidates. Products in the machine with low or negative votes = consider replacing.

Don't change everything at once. Swap 3-5 products per machine per cycle. Track the results.

### Step 6: Refresh Polls Quarterly
Customer preferences aren't static. Update your polls every 3 months with new product options. Remove items that are solidly established as winners — no need to keep validating them.

## What About the Machines Where Nobody Scans?

Fair question. Out of my 14 machines, 6 got strong engagement (10+ votes in the first month) and 8 were slower. Two machines got zero scans in the first month.

For low-scan machines, try:
- **Better QR code placement** — move it to where people naturally look while deciding what to buy
- **Add a callout** — *"Tell us what you want! Scan here"* in larger, bolder text
- **Mention it to the location contact** — ask them to tell employees about it
- **Offer an incentive** — some operators tape a $1 bill next to the QR code with "scan this, keep the dollar." Costs you $1, gets the first scan, and word spreads.

Even on machines with low scan rates, the data you *do* get is valuable. Five votes from daily customers who use the machine every day are more actionable than 50 random survey responses.

## Beyond Polling: The Compounding Effect

Here's what I didn't expect: the polling data improved more than just product selection.

### Better Purchasing Decisions
Knowing what customers want *before* buying inventory reduced my spoilage from ~4% to under 1.5%. I stopped buying products on speculation.

### Stronger Location Relationships
Two of my location managers asked to see the polling results. When I showed them the data — *"your employees voted for these products, and here are the sales results"* — it cemented the relationship. One proactively offered me a second machine location.

### Faster New Machine Optimization
When I added machine #15 and #16, I deployed QR polls from day one. Instead of the usual 2-3 months of trial and error to find the right product mix, I had strong data within 3 weeks. Those machines reached peak performance in half the typical time.

### Higher [Profit Margins](/blog/vending-machine-profit-margins-explained)
More items selling faster = less spoilage + fewer slow slots + higher revenue per visit. My net margin improved from roughly 39% to 46% — not all from polling, but it was the catalyst.

## The Bottom Line

The QR polling strategy isn't complicated. It isn't expensive. It doesn't require new hardware or technical skills. It just requires asking customers what they want and listening to the answer.

My results — 23% revenue increase, 73% reduction in stale slots, stronger location relationships — are real and replicable. The concept works whether you have 3 machines or 30.

The operators who stock based on data will always outperform the ones who stock based on gut feel. That's not an opinion. It's math, and I have the receipts to prove it.

**Try it yourself.** [Create your free IDDI account](/vendor/login), set up your first QR poll, and see what your customers actually want. It takes 20 minutes and costs nothing.
    `,
  },
};

function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try DB first, fall back to static
    publicAPI.getBlogPost(slug).then(res => {
      if (res.data?.data?.post) {
        setPost(res.data.data.post);
      } else if (staticContent[slug]) {
        setPost(staticContent[slug]);
      }
      setLoading(false);
    }).catch(() => {
      if (staticContent[slug]) {
        setPost(staticContent[slug]);
      }
      setLoading(false);
    });
  }, [slug]);

  if (loading) {
    return (
      <div style={{ backgroundColor: theme.bg, color: theme.text, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: theme.textSecondary }}>Loading...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div style={{ backgroundColor: theme.bg, color: theme.text, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <div>
          <h1>Post Not Found</h1>
          <Link to="/blog" style={{ color: theme.primary }}>Back to Blog</Link>
        </div>
      </div>
    );
  }

  // Simple markdown-like rendering for static content
  const renderContent = (content) => {
    return content.split('\n').map((line, i) => {
      const trimmed = line.trim();
      if (!trimmed) return <br key={i} />;
      if (trimmed.startsWith('## ')) return <h2 key={i} style={{ fontSize: '24px', fontWeight: '700', marginTop: '32px', marginBottom: '12px', color: theme.text }}>{trimmed.slice(3)}</h2>;
      if (trimmed.startsWith('### ')) return <h3 key={i} style={{ fontSize: '20px', fontWeight: '600', marginTop: '24px', marginBottom: '8px', color: theme.text }}>{trimmed.slice(4)}</h3>;
      if (trimmed.startsWith('| ')) {
        // Table row - render as styled div
        const cells = trimmed.split('|').filter(c => c.trim()).map(c => c.trim());
        if (cells.every(c => c.match(/^[-]+$/))) return null; // separator row
        return (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: `repeat(${cells.length}, 1fr)`, gap: '8px', padding: '8px 0', borderBottom: `1px solid ${theme.border}`, fontSize: '14px' }}>
            {cells.map((cell, j) => <div key={j} style={{ color: theme.textSecondary }} dangerouslySetInnerHTML={{ __html: cell.replace(/\*\*(.*?)\*\*/g, '<strong style="color: #f0f0f5">$1</strong>') }} />)}
          </div>
        );
      }
      if (trimmed.startsWith('- ') || trimmed.match(/^\d+\./)) {
        return <li key={i} style={{ color: theme.textSecondary, lineHeight: 1.8, marginLeft: '20px' }} dangerouslySetInnerHTML={{ __html: trimmed.replace(/^[-\d.]+\s*/, '').replace(/\*\*(.*?)\*\*/g, '<strong style="color: #f0f0f5">$1</strong>').replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color: #7c6df0">$1</a>') }} />;
      }
      // Regular paragraph
      return <p key={i} style={{ color: theme.textSecondary, lineHeight: 1.8, margin: '8px 0' }} dangerouslySetInnerHTML={{ __html: trimmed.replace(/\*\*(.*?)\*\*/g, '<strong style="color: #f0f0f5">$1</strong>').replace(/\*([^*]+)\*/g, '<em>$1</em>').replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color: #7c6df0">$1</a>') }} />;
    });
  };

  return (
    <div style={{ backgroundColor: theme.bg, color: theme.text, minHeight: '100vh' }}>
      <Helmet>
        <title>{post.title} | IDDI</title>
        <meta name="description" content={post.meta_description} />
        <link rel="canonical" href={`https://vending-front-end.vercel.app/blog/${slug}`} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={`${post.title} | IDDI`} />
        <meta property="og:description" content={post.meta_description} />
        <meta property="og:url" content={`https://vending-front-end.vercel.app/blog/${slug}`} />
        <meta property="og:site_name" content="IDDI" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={post.title} />
        <meta name="twitter:description" content={post.meta_description} />
      </Helmet>

      <nav style={{
        background: 'rgba(13, 13, 26, 0.95)', backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${theme.border}`, padding: '12px 24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <Link to="/" style={{ fontWeight: '800', fontSize: '22px', letterSpacing: '3px', color: '#fff', textDecoration: 'none' }}>IDDI</Link>
        <Link to="/vendor/login" style={{
          backgroundColor: theme.primary, color: '#fff', textDecoration: 'none',
          padding: '10px 20px', borderRadius: '6px', fontWeight: '600', fontSize: '14px',
        }}>
          Get Started Free
        </Link>
      </nav>

      <article style={{ maxWidth: '720px', margin: '0 auto', padding: '48px 24px' }}>
        <Link to="/blog" style={{ color: theme.primary, textDecoration: 'none', fontSize: '14px' }}>
          ← Back to Blog
        </Link>
        <h1 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: '800', marginTop: '16px', marginBottom: '8px', lineHeight: 1.2 }}>
          {post.title}
        </h1>
        <p style={{ color: theme.textMuted, fontSize: '14px', marginBottom: '32px' }}>
          {post.published_at && new Date(post.published_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>

        <div>{post.content && renderContent(post.content)}</div>

        {/* Lead Capture */}
        <div style={{ marginTop: '48px' }}>
          <LeadCapture
            headline="Free Guide: Top 50 Vending Products for 2026"
            description="Data-driven product recommendations by location type. Stop guessing — stock what sells."
            leadMagnet="Top 50 Vending Products Guide"
            source="blog"
          />
        </div>

        {/* CTA */}
        <div style={{
          marginTop: '32px', padding: '32px', backgroundColor: theme.primary + '10',
          border: `1px solid ${theme.primary}30`, borderRadius: '12px', textAlign: 'center',
        }}>
          <h3 style={{ margin: '0 0 8px' }}>Ready to manage your machines smarter?</h3>
          <p style={{ color: theme.textSecondary, margin: '0 0 16px' }}>
            IDDI is free, forever. Track inventory, poll customers, optimize routes.
          </p>
          <Link to="/vendor/login" style={{
            backgroundColor: theme.primary, color: '#fff', textDecoration: 'none',
            padding: '12px 32px', borderRadius: '6px', fontWeight: '600', display: 'inline-block',
          }}>
            Start Free
          </Link>
        </div>
      </article>

      {/* Exit Intent Popup */}
      <ExitIntentPopup
        headline="Don't Leave Empty-Handed"
        description="Get our free guide: the top 50 products that sell in vending machines, broken down by location type."
        leadMagnet="Top 50 Vending Products Guide"
        source="blog-exit"
      />
    </div>
  );
}

export default BlogPost;
