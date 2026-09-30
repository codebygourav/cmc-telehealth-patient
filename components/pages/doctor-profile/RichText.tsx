import { cn } from "@/lib/utils";

// Visible text of an HTML string ("<p></p>", "." and "N/A" count as empty).
export const hasText = (html?: string | null) => {
    const text = (html || "")
        .replace(/<[^>]*>/g, " ")
        .replace(/&nbsp;|&#160;/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    return text !== "" && !["." , "-", "n/a", "na", "nil", "none"].includes(text.toLowerCase());
};

// Admin rich-text content (the API sanitises it). Styles lists, tables and paragraphs.
export default function RichText({ html, className }: { html: string; className?: string }) {
    return (
        <div
            className={cn(
                "text-sm leading-relaxed text-[#4D4D4D] break-words",
                "[&_p]:mb-2 [&_p:last-child]:mb-0 [&_strong]:font-semibold [&_strong]:text-[#1F1E1E]",
                "[&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5 [&_ul]:space-y-1 [&_ol]:space-y-1 [&_li_p]:mb-0",
                "[&_a]:text-primary [&_a]:underline",
                "[&_table]:w-full [&_table]:border-collapse [&_table]:text-xs [&_td]:border [&_td]:border-[#E7E8EB] [&_td]:p-2 [&_td]:align-top [&_th]:border [&_th]:border-[#E7E8EB] [&_th]:p-2",
                className,
            )}
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
}
