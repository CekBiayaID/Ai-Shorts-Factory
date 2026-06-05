export default function FAQPage() {
  const faqs = [
    {
      question: "What is AI Shorts Factory?",
      answer:
        "AI Shorts Factory is an AI-powered tool that helps creators generate YouTube Shorts, TikTok scripts, titles, descriptions, hashtags, and content ideas in seconds.",
    },
    {
      question: "Is there a free plan?",
      answer:
        "Yes. Free users receive limited daily generations to try the platform before upgrading.",
    },
    {
      question: "What is included in the Pro plan?",
      answer:
        "The Pro plan provides higher generation limits, premium features, and a smoother content creation workflow.",
    },
    {
      question: "Can I cancel my subscription anytime?",
      answer:
        "Yes. You can cancel your subscription at any time.",
    },
    {
      question: "Do I need technical skills?",
      answer:
        "No. Simply enter your topic and AI Shorts Factory will generate content for you.",
    },
    {
      question: "Which platforms are supported?",
      answer:
        "AI Shorts Factory is designed for YouTube Shorts, TikTok, Instagram Reels, and other short-form content platforms.",
    },
  ];

  return (
    <div
      style={{
        maxWidth: "800px",
        margin: "0 auto",
        padding: "40px 20px",
        color: "white",
      }}
    >
      <h1 style={{ marginBottom: "30px" }}>
        Frequently Asked Questions
      </h1>

      {faqs.map((faq, index) => (
        <div
          key={index}
          style={{
            marginBottom: "20px",
            padding: "15px",
            border: "1px solid #333",
            borderRadius: "8px",
          }}
        >
          <h3>{faq.question}</h3>
          <p>{faq.answer}</p>
        </div>
      ))}
    </div>
  );
}