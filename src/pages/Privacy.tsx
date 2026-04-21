import SiteNav from "@/components/landing/SiteNav";

const Privacy = () => {
  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <SiteNav />
      <main className="flex-1">
        <section className="px-6 md:px-10 py-24 border-t hairline">
          <div className="max-w-3xl mx-auto">
            <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground mb-4">
              Privacy Policy
            </p>
            <h1 className="text-4xl md:text-5xl font-medium tracking-tight leading-[1.05] text-balance mb-10">
              Privacy Policy
            </h1>

            <div className="space-y-8 text-sm text-muted-foreground leading-relaxed">
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-3">1. Introduction</h2>
                <p>
                  QCK ("we", "our", or "us") operates the AI Visibility Checker service available at
                  qck.ai-visibility-check (the "Service"). This Privacy Policy explains how we collect,
                  use, and safeguard information when you use the Service, in compliance with the General
                  Data Protection Regulation (GDPR), California Consumer Privacy Act (CCPA), and other
                  applicable privacy laws.
                </p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-foreground mb-3">2. Information We Collect</h2>
                <p>When you use the Service, we collect the following:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>
                    <strong className="text-foreground">Keywords and Store Names:</strong> The search
                    queries and store URLs you submit for visibility scanning.
                  </li>
                  <li>
                    <strong className="text-foreground">IP Address:</strong> Collected automatically
                    for abuse detection, rate limiting, and geographic logging.
                  </li>
                  <li>
                    <strong className="text-foreground">Timestamp:</strong> Recorded when you submit
                    a visibility check.
                  </li>
                  <li>
                    <strong className="text-foreground">Consent Record:</strong> A record of your
                    agreement to our Terms of Service and this Privacy Policy at the time of submission.
                  </li>
                </ul>
                <p className="mt-3">
                  We do not collect passwords, payment information, or personal identity information
                  beyond what is described above.
                </p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-foreground mb-3">3. How We Use Your Information</h2>
                <p>We use collected information to:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Operate and improve the Service</li>
                  <li>Log consent as required by applicable law</li>
                  <li>Detect and prevent abuse, fraud, or unauthorized use</li>
                  <li>Comply with legal obligations</li>
                </ul>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-foreground mb-3">4. Data Storage and Retention</h2>
                <p>
                  Visibility scan data (keywords, store names, timestamps) is stored in our database when
                  the Service is operated with a Postgres backend. Consent records are retained for as long
                  as your account record is active, or as required by applicable law — whichever is longer.
                </p>
                <p className="mt-3">
                  When the Service is operated in memory-only mode, no persistent data is stored beyond
                  the session. However, IP addresses may still be logged by the server for abuse detection.
                </p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-foreground mb-3">5. Data Sharing</h2>
                <p>
                  We do not sell, trade, or rent your personal information to third parties. We may share
                  information only in the following circumstances:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>When required by law, subpoena, or court order</li>
                  <li>To protect the rights, property, or safety of QCK or others</li>
                  <li>In connection with a merger, acquisition, or sale of assets (with notice to users)</li>
                </ul>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-foreground mb-3">6. Cookies and Tracking</h2>
                <p>
                  The Service does not use tracking cookies. We use server-side logging for operational
                  and security purposes only. No behavioral advertising or cross-site tracking is employed.
                </p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-foreground mb-3">7. Your Rights</h2>
                <p>Depending on your jurisdiction, you may have the right to:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Access the personal data we hold about you</li>
                  <li>Request correction of inaccurate data</li>
                  <li>Request deletion of your data ("right to be forgotten")</li>
                  <li>Object to or restrict certain processing</li>
                  <li>Data portability</li>
                </ul>
                <p className="mt-3">
                  To exercise any of these rights, contact us at{" "}
                  <a href="mailto:privacy@qck.co" className="underline hover:text-foreground transition-colors">
                    privacy@qck.co
                  </a>
                  . We will respond within 30 days.
                </p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-foreground mb-3">8. Security</h2>
                <p>
                  We use industry-standard transport encryption (TLS) and restrict database access to
                  authorized personnel only. No system is completely secure, and we cannot guarantee
                  absolute security of your data.
                </p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-foreground mb-3">9. Children's Privacy</h2>
                <p>
                  The Service is not directed to individuals under the age of 16. We do not knowingly
                  collect data from children. If we learn that data from a child under 16 has been collected,
                  we will take steps to delete it promptly.
                </p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-foreground mb-3">10. International Transfers</h2>
                <p>
                  If you are located outside the United States, note that your information is processed on
                  servers located in the US. By using the Service, you consent to this transfer.
                </p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-foreground mb-3">11. Changes to This Policy</h2>
                <p>
                  We may update this Privacy Policy from time to time. We will post the updated policy
                  on this page with a revised "Last Updated" date. Continued use of the Service after
                  any change constitutes your acceptance of the updated policy.
                </p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-foreground mb-3">12. Contact</h2>
                <p>
                  Questions about this Privacy Policy? Contact our privacy team at{" "}
                  <a href="mailto:privacy@qck.co" className="underline hover:text-foreground transition-colors">
                    privacy@qck.co
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

export default Privacy;
