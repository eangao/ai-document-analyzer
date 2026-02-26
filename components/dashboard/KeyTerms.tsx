import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { KeyTerm } from "@/types";

interface KeyTermsProps {
  readonly terms: KeyTerm[];
}

export function KeyTerms({ terms }: KeyTermsProps) {
  // Group terms by category
  const groupedTerms = terms.reduce(
    (acc, term) => {
      if (!acc[term.category]) {
        acc[term.category] = [];
      }
      acc[term.category].push(term);
      return acc;
    },
    {} as Record<string, KeyTerm[]>
  );

  const categories = Object.keys(groupedTerms).sort();

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle className="text-base">Key Terms</CardTitle>
      </CardHeader>
      <CardContent>
        {terms.length === 0 ? (
          <p className="text-sm text-muted-foreground">No key terms found</p>
        ) : (
          <div className="space-y-6">
            {categories.map((category) => (
              <div key={category}>
                <h4 className="mb-3 text-sm font-semibold text-muted-foreground">
                  {category}
                </h4>
                <ul className="space-y-3">
                  {groupedTerms[category].map((term) => (
                    <li key={term.term} className="border-l-2 border-muted pl-4">
                      <p className="font-semibold text-foreground">
                        {term.term}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {term.definition}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
