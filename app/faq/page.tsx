export default function FAQPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-4xl mx-auto">

        <h1 className="text-4xl font-bold mb-8">
          Frequently Asked Questions
        </h1>

        <div className="space-y-6">

          <div>
            <h2 className="font-bold text-xl">
              What is AI Content Repurposer?
            </h2>
            <p className="text-gray-300">
              AI Content Repurposer helps creators transform videos,
              blog posts, podcasts, transcripts, and social media content
              into new content formats instantly.
            </p>
          </div>

          <div>
            <h2 className="font-bold text-xl">
              What content can I repurpose?
            </h2>
            <p className="text-gray-300">
              You can repurpose YouTube videos, blog articles,
              podcast transcripts, social media posts, and other text-based content.
            </p>
          </div>

          <div>
            <h2 className="font-bold text-xl">
              How many generations do I get?
            </h2>
            <p className="text-gray-300">
              Free users get 3 generations per day.
              Pro users get up to 100 generations per day.
            </p>
          </div>

          <div>
            <h2 className="font-bold text-xl">
              What is included in Pro?
            </h2>
            <p className="text-gray-300">
              Pro includes higher daily limits,
              PDF export, DOCX export,
              priority support, and access to all repurposing tools.
            </p>
          </div>

          <div>
            <h2 className="font-bold text-xl">
              Can I export my results?
            </h2>
            <p className="text-gray-300">
              Yes. Pro users can export results as PDF and DOCX files.
            </p>
          </div>

          <div>
            <h2 className="font-bold text-xl">
              Do you store my content?
            </h2>
            <p className="text-gray-300">
              Your content is processed to generate results.
              Please avoid submitting confidential information.
            </p>
          </div>

          <div>
            <h2 className="font-bold text-xl">
              Can I cancel my subscription?
            </h2>
            <p className="text-gray-300">
              Yes. You can cancel your subscription anytime.
            </p>
          </div>

        </div>

      </div>
    </main>
  );
}