const features = [
  {
    number: "01",
    title: "Thoughtful design",
    description:
      "Every detail is designed with simplicity and everyday use in mind.",
  },
  {
    number: "02",
    title: "Quality first",
    description:
      "We focus on materials and products that are made to be enjoyed longer.",
  },
  {
    number: "03",
    title: "Less waste",
    description:
      "A considered approach to products, packaging, and everything in between.",
  },
];

export default function FeaturesSection() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <div className="border-y border-neutral-200">
        <div className="grid md:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={feature.number}
              className={`py-10 md:px-8 ${
                index !== 0
                  ? "border-t border-neutral-200 md:border-l md:border-t-0"
                  : ""
              }`}
            >
              <span className="text-xs text-neutral-400">
                {feature.number}
              </span>

              <h3 className="mt-8 text-lg font-medium">
                {feature.title}
              </h3>

              <p className="mt-3 max-w-xs text-sm leading-6 text-neutral-500">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}