import SiteNav from "@/components/landing/SiteNav";

const Terms = () => {
  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <SiteNav />
      <main className="flex-1">
        <section className="px-6 md:px-10 py-24 border-t hairline">
          <div className="max-w-3xl mx-auto">
            <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground mb-4">
              Terms of Service
            </p>
            <h1 className="text-4xl md:text-5xl font-medium tracking-tight leading-[1.05] text-balance mb-10">
              Terms of Service
            </h1>

            <div className="space-y-8 text-sm text-muted-foreground leading-relaxed">
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-3">1. Acceptance of Terms</h2>
                <p>
                  By accessing or using the QCK AI Visibility Checker service ("Service"), you agree to be bound
                  by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the Service.
                </p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-foreground mb-3">2. Service Description</h2>
                <p>
                  QCK provides an AI visibility auditing tool that queries publicly available AI search models
                  (including but not limited to OpenAI GPT-4o, Anthropic Claude, Google Gemini, Perplexity, and
                  Meta Llama) to report where a given brand appears in AI-generated recommendations for
                  specific keyword queries. Results reflect AI model outputs at the time of scanning and may
                  change as models are updated.
                </p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-foreground mb-3">3. User Responsibilities</h2>
                <p>
                  You agree to use the Service only for lawful purposes. You may not use the Service to:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Probe, test, or scan AI systems for vulnerabilities</li>
                  <li>Extract or republish results without attribution</li>
                  <li>Submit false, misleading, or defamatory keywords or store names</li>
                  <li>Attempt to circumvent any usage limits or rate restrictions</li>
                </ul>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-foreground mb-3">4. Data Collection Notice</h2>
                <p>
                  When you submit a visibility check, the keyword, store name, your IP address, and timestamp
                  are recorded for service operation and fraud prevention purposes. By using the Service and
                  checking the consent box, you consent to this collection. See our Privacy Policy for
                  details on how data is handled.
                </p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-foreground mb-3">5. Results Are Informational</h2>
                <p>
                  QCK does not guarantee that scan results are complete, current, or free from error.
                  Results reflect AI model behavior at the time of the query and do not constitute an
                  endorsement or guarantee of performance. QCK is not responsible for any decisions made
                  based on scan results.
                </p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-foreground mb-3">6. Intellectual Property</h2>
                <p>
                  The Service, including its design, methodology, and content, is the property of QCK or its
                  licensors. You may not copy, modify, or redistribute any part of the Service without prior
                  written permission.
                </p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-foreground mb-3">7. Disclaimers</h2>
                <p>
                  THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
                  BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE.
                </p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-foreground mb-3">8. Limitation of Liability</h2>
                <p>
                  To the fullest extent permitted by law, QCK shall not be liable for any indirect, incidental,
                  special, consequential, or punitive damages, or any loss of profits or revenues, arising out of
                  your use of the Service.
                </p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-foreground mb-3">9. Changes to Terms</h2>
                <p>
                  We may update these Terms at any time. Continued use of the Service after any change
                  constitutes your acceptance of the updated Terms.
                </p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-foreground mb-3">10. Contact</h2>
                <p>
                  Questions about these Terms? Contact us at{" "}
                  <a href="mailto:legal@qck.co" className="underline hover:text-foreground transition-colors">
                    legal@qck.co
                  </a>
                  .
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Terms;
