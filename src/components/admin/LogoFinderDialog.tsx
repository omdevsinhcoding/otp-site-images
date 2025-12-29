import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Check, ImageIcon, Link2, Search } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import servicesData from '@/data/services.json';

interface Service {
  code: string;
  name: string;
  f?: string | number;
}

interface LogoFinderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceName: string;
  isDark: boolean;
  onConfirm: (logoUrl: string, serviceName?: string, serviceCode?: string) => void;
}

import { DEFAULT_SERVICE_ICON, getServiceLogoUrl } from '@/lib/logoUtils';

// Small edit-distance helper (fast enough for short strings)
const editDistance = (a: string, b: string): number => {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp: number[] = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(
        dp[j] + 1,
        dp[j - 1] + 1,
        prev + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
      prev = tmp;
    }
  }
  return dp[n];
};

const isNearPrefix = (search: string, word: string): boolean => {
  const prefix = word.slice(0, search.length);
  const maxDist = search.length <= 4 ? 1 : 2;
  return editDistance(search, prefix) <= maxDist;
};

// Check if search matches word with typo tolerance
const fuzzyMatch = (search: string, target: string, maxErrors: number): boolean => {
  if (target.includes(search)) return true;
  if (search.length < 3) return target.startsWith(search);
  
  // Check with edit distance for typo tolerance
  const dist = editDistance(search, target.slice(0, search.length));
  return dist <= maxErrors;
};

// Try to find words inside a concatenated string (tatanew -> tata, new)
const findSubstringMatch = (search: string, target: string): number => {
  const searchLower = search.toLowerCase();
  const targetLower = target.toLowerCase();
  
  // Direct substring match
  if (targetLower.includes(searchLower)) return 100;
  
  // Try splitting search into potential word boundaries
  // Check if target contains parts of search allowing 1-2 typos
  for (let i = 2; i < searchLower.length - 1; i++) {
    const part1 = searchLower.slice(0, i);
    const part2 = searchLower.slice(i);
    
    // Check if both parts are in target (tatanew -> tata + new)
    if (part1.length >= 2 && part2.length >= 2) {
      const p1Match = targetLower.includes(part1) || 
        editDistance(part1, targetLower.slice(0, part1.length)) <= 1;
      const p2Match = targetLower.includes(part2) ||
        (targetLower.length > part1.length && 
         editDistance(part2, targetLower.slice(-part2.length)) <= 1);
      
      if (p1Match && p2Match) return 80;
    }
  }
  
  // Check if search (with possible typos) appears in target
  for (let i = 0; i <= targetLower.length - searchLower.length; i++) {
    const substr = targetLower.slice(i, i + searchLower.length);
    if (editDistance(searchLower, substr) <= 2) return 70;
  }
  
  return 0;
};

// Find all matching services (smart multi-word search)
const findMatches = (searchTerm: string): Service[] => {
  const raw = searchTerm.toLowerCase().trim();
  if (!raw || raw.length < 2) return [];

  const services = servicesData as Service[];
  const seen = new Set<string>();
  const results: { service: Service; score: number }[] = [];

  // Prepare search variants
  const searchWords = raw.split(/\s+/).filter(w => w.length >= 2);
  const searchNoSpaces = raw.replace(/\s+/g, '');

  for (const service of services) {
    if (seen.has(service.code)) continue;
    seen.add(service.code);

    const name = service.name.toLowerCase();
    const nameNoSpaces = name.replace(/[\s+\/,\-\(\)]+/g, '');
    const code = service.code.toLowerCase();
    const nameWords = name.split(/[\s+\/,\-\(\)]+/).filter(Boolean);

    let score = 0;

    // 1. Exact matches
    if (name === raw || code === raw || nameNoSpaces === searchNoSpaces) {
      score = 100;
    }
    // 2. Name/code starts with search
    else if (name.startsWith(raw) || code.startsWith(raw) || nameNoSpaces.startsWith(searchNoSpaces)) {
      score = 95;
    }
    // 3. Substring match in concatenated name (handles "tatanew" -> "Tata Neu")
    else {
      const subMatch = findSubstringMatch(searchNoSpaces, nameNoSpaces);
      if (subMatch > 0) {
        score = subMatch;
      }
    }
    
    // 4. Word-based matching if no score yet
    if (score === 0) {
      // Any search word starts a name word
      if (searchWords.some(sw => nameWords.some(nw => nw.startsWith(sw)))) {
        const matchCount = searchWords.filter(sw => nameWords.some(nw => nw.startsWith(sw))).length;
        score = 60 + (matchCount * 5);
      }
      // Any search word contained in a name word
      else if (searchWords.some(sw => nameWords.some(nw => nw.includes(sw)))) {
        score = 50;
      }
      // Typo-tolerant prefix match
      else if (searchWords.some(sw => 
        nameWords.some(nw => nw.length >= sw.length && isNearPrefix(sw, nw))
      )) {
        score = 40;
      }
      // Code contains search
      else if (code.includes(searchNoSpaces) || searchNoSpaces.includes(code)) {
        score = 35;
      }
    }

    if (score > 0) results.push({ service, score });
  }

  results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.service.name.length - b.service.name.length;
  });

  return results.slice(0, 100).map((r) => r.service);
};

// Generate logo URL from service code using nested directory structure
const getLogoUrl = (code: string): string => {
  return getServiceLogoUrl(code);
};

export function LogoFinderDialog({ 
  open, 
  onOpenChange, 
  serviceName, 
  isDark,
  onConfirm 
}: LogoFinderDialogProps) {
  const [matches, setMatches] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [manualUrl, setManualUrl] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open && serviceName) {
      const found = findMatches(serviceName);
      setMatches(found);
      setSelectedService(null);
      setShowManualInput(false);
      setManualUrl('');
      setFailedImages(new Set());
    }
  }, [open, serviceName]);

  const handleImageError = (code: string) => {
    setFailedImages(prev => new Set(prev).add(code));
  };

  const handleSelectService = (service: Service) => {
    // Toggle selection - click again to deselect
    setSelectedService(prev => prev?.code === service.code ? null : service);
  };

  const handleClearSelection = () => {
    setSelectedService(null);
  };

  const handleConfirmSelected = () => {
    if (selectedService) {
      onConfirm(getLogoUrl(selectedService.code), selectedService.name, selectedService.code);
      onOpenChange(false);
    }
  };

  const handleUseDefault = () => {
    onConfirm(DEFAULT_SERVICE_ICON);
    onOpenChange(false);
  };

  const handleUseManualUrl = () => {
    if (manualUrl.trim()) {
      onConfirm(manualUrl.trim());
      onOpenChange(false);
    }
  };

  const hasMatches = matches.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "max-w-md rounded-2xl p-5",
        isDark ? "bg-gray-900 border-gray-800" : "bg-white"
      )}>
        <DialogHeader className="space-y-1">
          <DialogTitle className={cn(
            "text-base font-semibold flex items-center gap-2",
            isDark ? "text-white" : "text-gray-900"
          )}>
            <Search className="w-4 h-4 text-emerald-500" />
            Logo Finder
          </DialogTitle>
          <DialogDescription className={cn(
            "text-xs",
            isDark ? "text-gray-400" : "text-gray-500"
          )}>
            Results for "{serviceName}"
          </DialogDescription>
        </DialogHeader>

        <div className="mt-3 space-y-3">
          {hasMatches ? (
            <>
              {/* Matches Grid */}
              <ScrollArea className="h-[200px] pr-2">
                <div className="grid grid-cols-4 gap-2">
                  {matches.map((service) => {
                    const isSelected = selectedService?.code === service.code;
                    const hasFailed = failedImages.has(service.code);
                    
                    return (
                      <button
                        key={service.code}
                        onClick={() => handleSelectService(service)}
                        className={cn(
                          "relative p-2 rounded-lg border-2 transition-all flex flex-col items-center gap-1",
                          isSelected 
                            ? "border-emerald-500 bg-emerald-500/10" 
                            : isDark 
                              ? "border-gray-700 hover:border-gray-600 bg-gray-800/50" 
                              : "border-gray-200 hover:border-gray-300 bg-gray-50"
                        )}
                      >
                        {isSelected && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 text-white" />
                          </div>
                        )}
                        {!hasFailed ? (
                          <img
                            src={getLogoUrl(service.code)}
                            alt={service.name}
                            className="w-10 h-10 rounded object-contain bg-white p-1"
                            onError={() => handleImageError(service.code)}
                          />
                        ) : (
                          <div className={cn(
                            "w-10 h-10 rounded flex items-center justify-center",
                            isDark ? "bg-gray-700" : "bg-gray-200"
                          )}>
                            <ImageIcon className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                        <span className={cn(
                          "text-[10px] text-center line-clamp-2 leading-tight",
                          isDark ? "text-gray-300" : "text-gray-600"
                        )}>
                          {service.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>

              {/* Selected Preview */}
              {selectedService && (
                <div className={cn(
                  "flex items-center gap-3 p-3 rounded-xl",
                  isDark ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-emerald-50 border border-emerald-100"
                )}>
                  <img
                    src={getLogoUrl(selectedService.code)}
                    alt={selectedService.name}
                    className="w-10 h-10 rounded-lg object-contain bg-white p-1"
                  />
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-medium truncate", isDark ? "text-white" : "text-gray-900")}>
                      {selectedService.name}
                    </p>
                    <p className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>
                      Code: {selectedService.code}
                    </p>
                  </div>
                </div>
              )}
            </>
          ) : (
            // No matches
            <div className={cn(
              "rounded-xl p-4 text-center",
              isDark ? "bg-amber-500/10 border border-amber-500/20" : "bg-amber-50 border border-amber-100"
            )}>
              <div className="flex justify-center mb-2">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center",
                  isDark ? "bg-gray-800" : "bg-gray-100"
                )}>
                  <ImageIcon className={cn("w-6 h-6", isDark ? "text-gray-600" : "text-gray-400")} />
                </div>
              </div>
              <p className={cn("text-sm font-medium", isDark ? "text-amber-400" : "text-amber-600")}>
                No matches found
              </p>
              <p className={cn("text-xs mt-0.5", isDark ? "text-gray-400" : "text-gray-500")}>
                Use default or enter URL
              </p>
            </div>
          )}

          {/* Manual URL Input */}
          {showManualInput && (
            <Input
              placeholder="Enter image URL..."
              value={manualUrl}
              onChange={(e) => setManualUrl(e.target.value)}
              className={cn(
                "h-9 rounded-lg text-sm",
                isDark ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-200"
              )}
            />
          )}

          {/* Actions */}
          <div className="flex gap-2">
            {hasMatches && selectedService ? (
              <>
                <Button
                  onClick={handleConfirmSelected}
                  className="flex-1 h-9 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm"
                >
                  <Check className="w-3.5 h-3.5 mr-1.5" />
                  Use Selected
                </Button>
                <Button
                  variant="outline"
                  onClick={handleClearSelection}
                  className={cn(
                    "h-9 rounded-lg text-sm px-3",
                    isDark ? "border-gray-700 text-gray-300 hover:bg-gray-800" : ""
                  )}
                >
                  Clear
                </Button>
              </>
            ) : (
              <Button
                onClick={handleUseDefault}
                className={cn(
                  "flex-1 h-9 rounded-lg text-sm",
                  isDark ? "bg-gray-700 hover:bg-gray-600 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                )}
              >
                Use Default
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className={cn(
                "h-9 rounded-lg text-sm px-3",
                isDark ? "border-gray-700 text-gray-300 hover:bg-gray-800" : ""
              )}
            >
              Cancel
            </Button>
          </div>

          {showManualInput && manualUrl.trim() && (
            <Button
              onClick={handleUseManualUrl}
              className="w-full h-9 rounded-lg bg-purple-500 hover:bg-purple-600 text-white text-sm"
            >
              <Check className="w-3.5 h-3.5 mr-1.5" />
              Use URL
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
