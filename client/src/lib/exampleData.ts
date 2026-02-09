// ─── Example Customer Interview Transcripts ───

export const EXAMPLE_TRANSCRIPTS = [
  {
    name: "interview_sarah_pm.txt",
    label: "Sarah (Product Manager)",
    description: "Frustrated with onboarding flow",
    content: `Customer Interview - Sarah Chen, Product Manager at TechFlow Inc.
Date: 2026-01-15 | Interviewer: Alex Rivera

Q: Tell me about your experience getting started with our product.
A: Honestly, the onboarding was really rough. I signed up expecting to get started in a few minutes, but it took me almost 45 minutes to figure out how to set up my first project. The setup wizard kept asking me questions I didn't understand, like "Select your integration protocol" — I'm a PM, not an engineer. I almost gave up.

Q: What kept you going?
A: My colleague told me it was worth it once you get past the initial setup. And she was right — the core product is great. But you're losing people at that first step. I know at least two people on my team who tried it and bounced.

Q: What features do you use most?
A: The dashboard analytics are fantastic. I check them every morning. The real-time data view is something I haven't found anywhere else. But I wish I could customize the dashboard more. Right now I have to scroll past a bunch of widgets I don't care about to get to the ones I need.

Q: Any other pain points?
A: The export feature is broken — or at least it feels broken. When I try to export a report to PDF, it takes forever and sometimes just fails silently. I've had to screenshot my dashboard for presentations, which is embarrassing. Also, the mobile app is basically unusable. I've given up on checking things from my phone.

Q: If you could change one thing about the product, what would it be?
A: Make the onboarding simpler. Way simpler. Maybe a guided tour instead of that wizard. And let me skip the technical stuff — I can always configure integrations later.

Q: How likely are you to recommend us to a colleague?
A: 7 out of 10. The core product is an 9, but the experience around it brings it down. Fix the onboarding and the mobile app, and I'd be shouting from the rooftops.`,
  },
  {
    name: "interview_marcus_eng.txt",
    label: "Marcus (Engineer)",
    description: "API issues and performance concerns",
    content: `Customer Interview - Marcus Johnson, Senior Engineer at DataPipe
Date: 2026-01-22 | Interviewer: Alex Rivera

Q: How does your team use our product?
A: We integrated it into our CI/CD pipeline about 6 months ago. The API is the main touchpoint for us. We push data through it and use the analytics on the other side.

Q: How has the API experience been?
A: Mixed. The documentation is decent but has gaps. I spent two days debugging an issue that turned out to be an undocumented rate limit. When I hit 100 requests per minute, the API just starts returning 429s with no helpful error message — just "rate limited." No info about when I can retry or what the actual limits are.

Q: What about performance?
A: The API response times have been getting worse. When we first integrated, average response was around 200ms. Now it's regularly 800ms-1.2s. For our use case, that's a problem because we're processing thousands of records. I've raised this with support twice and got canned responses both times.

Q: How is the support experience?
A: Honestly, it's the weakest part. I submitted a critical bug report three weeks ago — our data was being silently dropped when payloads exceeded 5MB. It took 8 days to get a human response, and they asked me to "try clearing my cache." For a server-side API issue. I had to escalate three times before someone technical looked at it.

Q: What do you like about the product?
A: The data transformation engine is genuinely best-in-class. The query language is powerful and well-designed. The webhook system is reliable. When it works, it works really well. I just wish the operational side matched the product quality.

Q: What would make you upgrade to the enterprise plan?
A: Better SLAs, dedicated support, and honestly, just fix the performance regression. I can't justify paying more when the base product is getting slower. Also, SSO support — our security team requires it and you only offer it on enterprise. That feels like it should be standard.`,
  },
  {
    name: "interview_priya_designer.txt",
    label: "Priya (Designer)",
    description: "Loves visualization, wants collaboration",
    content: `Customer Interview - Priya Sharma, UX Designer at CreativeStack
Date: 2026-01-28 | Interviewer: Alex Rivera

Q: What drew you to our product initially?
A: The visualization capabilities. I was looking for something that could turn raw user research data into visual stories. Most tools give you spreadsheets and charts, but yours actually makes the data feel alive. The heatmap feature is gorgeous.

Q: How do you use it day-to-day?
A: I upload user testing session data and use the analysis tools to find patterns. Then I create visual reports for stakeholders. The auto-generated insight cards are really helpful — they save me hours of manual analysis.

Q: What's frustrating about the experience?
A: Collaboration is basically non-existent. I can't share a project with my team without giving them my login. There's no commenting, no version history, no way to tag someone and say "look at this insight." I end up exporting everything and putting it in Figma or Notion, which defeats the purpose.

Q: Tell me more about the collaboration gap.
A: Last week, I found a critical insight about our checkout flow — users were dropping off at the address form. I wanted to share it with my PM immediately, but I had to export it, take screenshots, write up context in Slack, and hope she understood what she was looking at. If I could have just shared a link with a comment, it would have taken 30 seconds instead of 20 minutes.

Q: Any other feature requests?
A: Dark mode, please! I work late and the bright white interface is painful. Also, I'd love to be able to create custom templates for my reports. Right now every report starts from scratch. And the color palette for charts is not accessible — I've had colorblind colleagues who can't distinguish between the chart segments.

Q: How would you rate the product overall?
A: 8 out of 10 for individual use. 4 out of 10 for team use. It's a fantastic solo tool that completely falls apart when you need to work with others. Fix collaboration and you'd own the market.`,
  },
  {
    name: "interview_james_cto.txt",
    label: "James (CTO)",
    description: "Security concerns, wants enterprise features",
    content: `Customer Interview - James Park, CTO at FinSecure
Date: 2026-02-01 | Interviewer: Alex Rivera

Q: What's your role in the purchasing decision?
A: I'm the final sign-off on all SaaS tools. My team of 40 engineers uses your product, but I'm the one who has to justify the spend and ensure it meets our compliance requirements.

Q: What compliance concerns do you have?
A: Several. First, we're in fintech, so we need SOC 2 compliance. I've asked your team three times for your SOC 2 report and haven't received it. Second, data residency — we need to know where our data is stored and processed. Your privacy policy is vague on this. Third, we need audit logs. Every action a user takes needs to be logged for our compliance team. You don't have this.

Q: How does this affect your purchasing decision?
A: We're currently on the team plan at $500/month. I want to upgrade to enterprise, but I can't until these compliance gaps are addressed. My security team has flagged it as a risk. If you don't address these in the next quarter, we'll have to migrate to a competitor, which would be painful but necessary.

Q: What do your engineers think of the product?
A: They love it. That's what makes this frustrating. The technical capabilities are excellent. The query performance, the data pipeline reliability, the visualization engine — all top-notch. But enterprise readiness is about more than features. It's about trust, security, and operational maturity.

Q: What specific enterprise features would unlock the upgrade for you?
A: In priority order: SOC 2 certification, SSO/SAML integration, audit logging, data residency controls, and role-based access control. Right now, every user on our team has the same permissions, which is a security nightmare. I need to be able to restrict who can export data, who can delete projects, and who can access sensitive datasets.

Q: Any other feedback?
A: Your uptime has been good — I'll give you that. But you need a proper status page with incident history. And your terms of service need a DPA addendum for GDPR compliance. These aren't nice-to-haves for enterprise customers; they're table stakes.`,
  },
];

// ─── Example Product Usage Data (CSV) ───

export const EXAMPLE_CSV_FILES = [
  {
    name: "feature_usage_metrics.csv",
    label: "Feature Usage Metrics",
    description: "Monthly feature adoption data",
    content: `feature_name,monthly_active_users,total_sessions,avg_session_duration_min,adoption_rate_pct,satisfaction_score,error_rate_pct,support_tickets
Dashboard Analytics,4521,28450,12.3,89.2,4.2,1.2,45
Data Import Wizard,3200,8900,8.7,63.1,2.8,8.5,312
Report Builder,2890,15600,18.5,57.0,3.9,2.1,89
API Integration,1850,42000,0.5,36.5,3.5,4.8,267
Real-time Monitoring,3100,22000,25.1,61.2,4.5,0.8,23
Export to PDF,2400,6700,2.1,47.4,2.1,12.3,445
Mobile App,1200,3400,3.2,23.7,1.9,15.7,523
Collaboration (Share),890,2100,5.4,17.6,2.4,6.2,198
Custom Webhooks,1560,18900,0.3,30.8,4.1,1.5,56
User Management,980,4200,4.8,19.3,3.0,3.4,134
Search & Filter,3800,31000,1.2,75.0,3.8,0.5,28
Notification Center,2100,9800,1.8,41.4,3.2,2.0,67
Template Library,1750,5600,7.3,34.5,3.6,1.8,43
Heatmap Visualization,2650,11200,9.8,52.3,4.4,0.9,31
Audit Log,450,1200,3.1,8.9,2.5,0.3,89`,
  },
  {
    name: "user_feedback_survey.csv",
    label: "User Feedback Survey",
    description: "NPS and satisfaction survey results",
    content: `respondent_id,role,company_size,plan_type,nps_score,overall_satisfaction,ease_of_use,feature_completeness,performance_rating,support_rating,would_recommend,top_complaint,top_praise,months_as_customer
R001,Product Manager,50-200,team,7,4,3,4,4,3,yes,Onboarding is confusing,Great analytics dashboard,8
R002,Engineer,200-500,team,9,5,4,5,4,4,yes,API docs need work,Powerful query language,14
R003,Designer,10-50,pro,8,4,4,3,5,3,yes,No collaboration features,Beautiful visualizations,6
R004,CTO,500+,enterprise,5,3,3,4,3,2,no,Missing SOC2 compliance,Reliable data pipeline,18
R005,Data Analyst,50-200,team,8,4,4,4,4,3,yes,Export is unreliable,Real-time monitoring,11
R006,Product Manager,10-50,pro,6,3,2,3,3,2,no,Mobile app is terrible,Dashboard customization,4
R007,Engineer,200-500,team,9,5,5,4,5,4,yes,Rate limiting not documented,Webhook reliability,22
R008,Designer,50-200,team,4,2,3,2,3,1,no,No dark mode,Heatmap feature,3
R009,VP Product,500+,enterprise,6,3,3,4,3,3,no,No RBAC,Data transformation engine,15
R010,Engineer,50-200,pro,7,4,4,4,3,3,yes,Performance degradation,Query language design,9
R011,Product Manager,200-500,team,8,4,3,4,4,3,yes,Setup wizard too technical,Auto-generated insights,7
R012,CTO,200-500,enterprise,5,3,2,3,3,2,no,No audit logging,Uptime reliability,20
R013,Designer,10-50,pro,9,5,5,4,5,4,yes,Limited chart colors,Insight cards feature,12
R014,Engineer,500+,enterprise,7,4,4,5,3,3,yes,API response time slow,Data pipeline quality,16
R015,Data Analyst,50-200,team,8,4,4,4,4,4,yes,Can't customize dashboards,Search and filter,10
R016,Product Manager,10-50,pro,3,2,1,3,2,1,no,Onboarding made me quit almost,Core product is solid,1
R017,Engineer,200-500,team,8,4,4,4,4,3,yes,5MB payload limit,Transformation engine,13
R018,VP Product,500+,enterprise,6,3,3,3,3,2,no,No SSO support,Analytics depth,24
R019,Designer,50-200,team,7,3,3,3,4,3,yes,No version history,Visual report builder,8
R020,Data Analyst,200-500,team,9,5,4,5,5,4,yes,Minor UI inconsistencies,Overall data quality,19`,
  },
];

// Helper to convert string to base64
export function stringToBase64(str: string): string {
  return btoa(unescape(encodeURIComponent(str)));
}
