import re

with open('src/components/pos/product-detail-screen.tsx', 'r') as f:
    content = f.read()

# Add states for variants dialog
dialog_states = """  const [variantDialogOpen, setVariantDialogOpen] = useState(false)
  const [variantForm, setVariantForm] = useState({ name: '', sku: '', size: '', color: '', price: '', stockCount: '' })
  const [submitting, setSubmitting] = useState(false)
"""
content = re.sub(r"  // Fetch product details", dialog_states + "\n  // Fetch product details", content)

# Add variant API handler
api_handler = """  async function handleAddVariant() {
    if (!variantForm.name) {
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/variants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: detailProductId,
          ...variantForm,
          price: variantForm.price ? parseFloat(variantForm.price) : undefined,
          stockCount: parseInt(variantForm.stockCount) || 0
        })
      })
      if (res.ok) {
        setVariantDialogOpen(false)
        setVariantForm({ name: '', sku: '', size: '', color: '', price: '', stockCount: '' })
        queryClient.invalidateQueries({ queryKey: ['product-detail'] })
      }
    } catch(e) {}
    finally { setSubmitting(false) }
  }
"""
content = content.replace("  if (!detailProductId) {", "  const queryClient = useQueryClient()\n" + api_handler + "\n  if (!detailProductId) {")

imports = """import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Package, Plus, Pencil, SlidersHorizontal, Image as ImageIcon, Layers } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'"""
content = re.sub(r"import \{ useQuery \} from '@tanstack/react-query'\nimport \{ ArrowLeft.*?\} from 'lucide-react'", imports, content, flags=re.DOTALL)

variants_ui = """            {/* Variants Section */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2"><Layers className="h-5 w-5" /> Product Variants</h3>
                <Button variant="outline" size="sm" className="gap-2" onClick={() => setVariantDialogOpen(true)}>
                  <Plus className="h-4 w-4" /> Add Variant
                </Button>
              </div>
              
              {product.variants && product.variants.length > 0 ? (
                <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-zinc-50 border-b text-xs uppercase text-zinc-500 font-semibold">
                      <tr>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">SKU</th>
                        <th className="px-4 py-3">Size / Color</th>
                        <th className="px-4 py-3">Price</th>
                        <th className="px-4 py-3">Stock</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {product.variants.map((v: any) => (
                        <tr key={v.id} className="hover:bg-zinc-50">
                          <td className="px-4 py-3 font-medium text-zinc-900">{v.name}</td>
                          <td className="px-4 py-3 text-zinc-500">{v.sku || '—'}</td>
                          <td className="px-4 py-3 text-zinc-500">{v.size || '—'} / {v.color || '—'}</td>
                          <td className="px-4 py-3">{v.price ? formatCurrency(v.price) : 'Default'}</td>
                          <td className="px-4 py-3 font-semibold">{v.stockCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-zinc-500 text-sm p-4 border rounded-xl bg-zinc-50 text-center">
                  No variants added yet. Add variants for different sizes or colors.
                </div>
              )}
            </div>"""

content = content.replace("            {product.description && (", variants_ui + "\n            {product.description && (")

dialog_ui = """      {/* Variant Dialog */}
      <Dialog open={variantDialogOpen} onOpenChange={setVariantDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Product Variant</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Variant Name</Label>
              <Input placeholder="e.g. Large / Red" value={variantForm.name} onChange={e => setVariantForm({...variantForm, name: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Size</Label>
                <Input placeholder="e.g. L" value={variantForm.size} onChange={e => setVariantForm({...variantForm, size: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <Input placeholder="e.g. Red" value={variantForm.color} onChange={e => setVariantForm({...variantForm, color: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>SKU Override</Label>
                <Input value={variantForm.sku} onChange={e => setVariantForm({...variantForm, sku: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Price Override</Label>
                <Input type="number" placeholder="Leave empty for default" value={variantForm.price} onChange={e => setVariantForm({...variantForm, price: e.target.value})} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVariantDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddVariant} disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {submitting ? 'Saving...' : 'Add Variant'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>"""

content = content.replace("    </div>\n  )\n}", dialog_ui + "\n  )\n}")

with open('src/components/pos/product-detail-screen.tsx', 'w') as f:
    f.write(content)

with open('src/app/api/variants/route.ts', 'w') as f:
    f.write("""import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const variant = await db.productVariant.create({
      data: {
        productId: data.productId,
        name: data.name,
        sku: data.sku || null,
        size: data.size || null,
        color: data.color || null,
        price: data.price || null,
        stockCount: data.stockCount || 0
      }
    })
    
    // Also update product hasVariants
    await db.product.update({
      where: { id: data.productId },
      data: { hasVariants: true }
    })
    
    return NextResponse.json(variant)
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
""")
