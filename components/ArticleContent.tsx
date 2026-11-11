import { boldParts, parseBody } from "@/data/articles";

function Inline({ text }: { text: string }) {
  return (
    <>
      {boldParts(text).map((part, index) => (part.bold ? <strong key={index}>{part.text}</strong> : <span key={index}>{part.text}</span>))}
    </>
  );
}

/** Renders an article body (headings, paragraphs, lists, bold) as plain React text — never as HTML. */
export function ArticleContent({ body }: { body: string }) {
  return (
    <div className="space-y-4 text-pretty text-[1.0625rem] leading-relaxed">
      {parseBody(body).map((block, index) => {
        if (block.kind === "h2") return <h2 key={index} className="title-section pt-3 text-black"><Inline text={block.text} /></h2>;
        if (block.kind === "h3") return <h3 key={index} className="pt-1 font-fredoka text-lg font-semibold text-black"><Inline text={block.text} /></h3>;
        if (block.kind === "list") {
          return (
            <ul key={index} className="list-disc space-y-1.5 pl-6 marker:text-[#8DB255]">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}><Inline text={item} /></li>
              ))}
            </ul>
          );
        }
        return <p key={index}><Inline text={block.text} /></p>;
      })}
    </div>
  );
}
