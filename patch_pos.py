import re

with open('src/components/pos/pos-screen.tsx', 'r') as f:
    content = f.read()

# Add new state variables
new_states = """  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [discountAmount, setDiscountAmount] = useState<number>(0)
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage')
  const [paymentStep, setPaymentStep] = useState<'method' | 'tip' | 'receipt'>('method')
  const [tipPercentage, setTipPercentage] = useState<number>(0)
  const [customTip, setCustomTip] = useState<number | null>(null)
  const [tipPresets, setTipPresets] = useState<number[]>([15, 18, 20])
  const [customerEmail, setCustomerEmail] = useState<string>('')
  const [sendReceipt, setSendReceipt] = useState<boolean>(true)
"""
content = re.sub(r"  const \[paymentDialogOpen, setPaymentDialogOpen\] = useState\(false\)", new_states, content)

# Fetch settings for tip presets
fetch_settings = """  // ── Fetch products ──
  useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/settings')
        if (res.ok) {
          const data = await res.json()
          if (data.tipPresets) setTipPresets(JSON.parse(data.tipPresets))
        }
      } catch (e) {}
      return null
    }
  })
  
  const { data: products = [], isLoading } = useQuery({"""
content = content.replace("  // ── Fetch products ──\n  const { data: products = [], isLoading } = useQuery({", fetch_settings)

# Update cart totals
totals = """  // ── Cart totals ──
  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const discountValue = discountType === 'percentage' ? (cartSubtotal * discountAmount) / 100 : discountAmount
  const subtotal = Math.max(0, cartSubtotal - discountValue)
  const tax = subtotal * 0.08
  const tipValue = customTip !== null ? customTip : (subtotal * tipPercentage) / 100
  const total = subtotal + tax + tipValue
  const itemCount = cart.reduce((s, c) => s + c.quantity, 0)"""
content = re.sub(r"  // ── Cart totals ──\s+const subtotal = [^\n]+\n\s+const tax = [^\n]+\n\s+const total = [^\n]+\n\s+const itemCount = [^\n]+", totals, content)

# Update resetToNewOrder
reset = """  const resetToNewOrder = useCallback(() => {
    clearCart()
    setActiveOrderId(null)
    setActiveCustomer(null)
    setOrderNote('')
    setOrderLocation('')
    setDiscountAmount(0)
    setTipPercentage(0)
    setCustomTip(null)
    setCustomerEmail('')
    setPaymentStep('method')
    queryClient.invalidateQueries({ queryKey: ['orders'] })
  }, [clearCart, setActiveOrderId, setActiveCustomer, queryClient])"""
content = re.sub(r"  const resetToNewOrder = useCallback\(\(\) => \{.*?\}, \[clearCart, setActiveOrderId, setActiveCustomer, queryClient\]\)", reset, content, flags=re.DOTALL)

# Update confirmCharge to include discount, tip, save card logic
confirm_charge = """  async function confirmCharge() {
    setCharging(true)
    try {
      const items = cart.map((c) => ({
        productId: c.id,
        quantity: c.quantity,
        price: c.price,
        subtotal: c.price * c.quantity,
      }))

      const body: Record<string, unknown> = {
        tabType: activeCustomer ? (paymentMethod === 'open-tab' ? 'open-tab' : 'walk-in') : 'walk-in',
        customerName: activeCustomer?.name || null,
        customerId: activeCustomer?.id || null,
        location: orderLocation || null,
        notes: orderNote || null,
        paymentMethod: paymentMethod === 'open-tab' ? 'card' : paymentMethod,
        discount: discountValue,
        discountType,
        tip: tipValue,
        items,
        sendReceipt: sendReceipt && customerEmail ? true : false,
        customerEmail: customerEmail || undefined,
      }

      if (activeOrderId) {
        body.id = activeOrderId
      }

      const res = await fetch('/api/orders', {
        method: activeOrderId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error('Failed to process order')

      toast.success(`Order ${activeOrderId ? 'updated' : 'created'} — ${formatCurrency(total)}`)
      
      if (sendReceipt && customerEmail) {
        toast.success(`Receipt sent to ${customerEmail}`)
      }
      
      setPaymentDialogOpen(false)

      // Reset for new order
      resetToNewOrder()
      refreshOrders()
      refreshProducts()
    } catch {
      toast.error('Failed to process order')
    } finally {
      setCharging(false)
    }
  }"""
content = re.sub(r"  async function confirmCharge\(\) \{.*?\n  \}", confirm_charge, content, flags=re.DOTALL)

# Update Cart Totals UI
cart_ui = """            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Subtotal</span>
                <span className="text-zinc-900 tabular-nums">{formatCurrency(cartSubtotal)}</span>
              </div>
              
              {/* Discount Section */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-sm items-center">
                  <span className="text-zinc-500">Discount</span>
                  <div className="flex items-center gap-1">
                    <Input 
                      type="number" 
                      value={discountAmount || ''} 
                      onChange={(e) => setDiscountAmount(Number(e.target.value))}
                      className="w-16 h-6 text-xs text-right px-1"
                    />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-6 px-1.5 text-xs"
                      onClick={() => setDiscountType(t => t === 'percentage' ? 'fixed' : 'percentage')}
                    >
                      {discountType === 'percentage' ? '%' : '$'}
                    </Button>
                  </div>
                </div>
                {discountValue > 0 && (
                  <div className="flex justify-between text-xs text-emerald-600">
                    <span>Applied Discount</span>
                    <span className="tabular-nums">-{formatCurrency(discountValue)}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Tax (8%)</span>
                <span className="text-zinc-900 tabular-nums">{formatCurrency(tax)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-base">
                <span className="font-bold text-zinc-900">Total</span>
                <span className="font-bold text-zinc-900 tabular-nums">{formatCurrency(subtotal + tax)}</span>
              </div>
            </div>
            <Button
              onClick={() => {
                setPaymentStep('method')
                setPaymentDialogOpen(true)
              }}"""
content = re.sub(r"            <div className=\"space-y-1\.5\">\n              <div className=\"flex justify-between text-sm\">\n                <span className=\"text-zinc-500\">Subtotal</span>.*?<Button\n              onClick=\{handleCharge\}", cart_ui, content, flags=re.DOTALL)

# Update Payment Dialog Content
dialog_content = """        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>
              {paymentStep === 'method' && 'Payment Method'}
              {paymentStep === 'tip' && 'Add Tip'}
              {paymentStep === 'receipt' && 'Receipt & Complete'}
            </DialogTitle>
            <DialogDescription>
              {paymentStep === 'method' && (activeOrderId ? 'Update and close this order?' : 'Complete this order?')}
              {paymentStep === 'tip' && 'Select a tip amount or enter a custom tip.'}
              {paymentStep === 'receipt' && 'Would you like a receipt?'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {paymentStep === 'method' && (
              <>
                {/* Customer info */}
                <div className="bg-zinc-50 rounded-lg p-3 space-y-1">
                  <p className="text-sm font-medium text-zinc-900">
                    {activeCustomer?.name || 'Walk-in'}
                  </p>
                  {orderLocation && (
                    <p className="text-xs text-zinc-500">{orderLocation}</p>
                  )}
                  {(activeCustomer?.email || activeCustomer?.phone) && (
                    <p className="text-xs text-zinc-400">
                      {[activeCustomer?.email, activeCustomer?.phone].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </div>

                {/* Order summary */}
                <div className="space-y-1 text-sm">
                  {cart.map((item) => (
                    <div key={item.id} className="flex justify-between">
                      <span className="text-zinc-600">{item.quantity}× {item.name}</span>
                      <span className="tabular-nums">{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  ))}
                  {discountValue > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Discount</span>
                      <span className="tabular-nums">-{formatCurrency(discountValue)}</span>
                    </div>
                  )}
                  <Separator className="my-1.5" />
                  <div className="flex justify-between text-xs text-zinc-500">
                    <span>Subtotal</span>
                    <span className="tabular-nums">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-zinc-500">
                    <span>Tax</span>
                    <span className="tabular-nums">{formatCurrency(tax)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-zinc-900">
                    <span>Total</span>
                    <span className="tabular-nums">{formatCurrency(subtotal + tax)}</span>
                  </div>
                </div>

                {/* Payment method */}
                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant={paymentMethod === 'card' ? 'default' : 'outline'}
                      className={paymentMethod === 'card' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                      onClick={() => setPaymentMethod('card')}
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Card
                    </Button>
                    <Button
                      type="button"
                      variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                      className={paymentMethod === 'cash' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                      onClick={() => setPaymentMethod('cash')}
                    >
                      <span className="mr-2">$</span>
                      Cash
                    </Button>
                  </div>
                  {activeCustomer && (
                    <Button
                      type="button"
                      variant={paymentMethod === 'open-tab' ? 'default' : 'outline'}
                      className={`w-full mt-2 ${paymentMethod === 'open-tab' ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}`}
                      onClick={() => setPaymentMethod('open-tab')}
                    >
                      <UserCircle className="h-4 w-4 mr-2" />
                      Save Card & Open Tab
                    </Button>
                  )}
                </div>
              </>
            )}

            {paymentStep === 'tip' && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  {tipPresets.map(preset => (
                    <Button
                      key={preset}
                      variant={tipPercentage === preset && customTip === null ? 'default' : 'outline'}
                      onClick={() => { setTipPercentage(preset); setCustomTip(null); }}
                      className={tipPercentage === preset && customTip === null ? 'bg-emerald-600' : ''}
                    >
                      {preset}%<br/>
                      <span className="text-xs opacity-70 block mt-1">{formatCurrency((subtotal * preset) / 100)}</span>
                    </Button>
                  ))}
                </div>
                <div className="space-y-2 pt-2 border-t">
                  <Label>Custom Tip ($)</Label>
                  <Input 
                    type="number" 
                    value={customTip || ''} 
                    onChange={e => {
                      setCustomTip(Number(e.target.value))
                      setTipPercentage(0)
                    }} 
                    placeholder="Enter custom amount" 
                  />
                </div>
                <Button 
                  variant="ghost" 
                  className="w-full text-zinc-500"
                  onClick={() => { setTipPercentage(0); setCustomTip(0); }}
                >
                  No Tip
                </Button>
                
                <div className="bg-emerald-50 rounded-lg p-3 mt-4">
                  <div className="flex justify-between font-bold text-zinc-900">
                    <span>New Total</span>
                    <span className="tabular-nums">{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>
            )}

            {paymentStep === 'receipt' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 pt-2">
                  <Switch id="send-receipt" checked={sendReceipt} onCheckedChange={setSendReceipt} />
                  <Label htmlFor="send-receipt" className="cursor-pointer">Email Receipt</Label>
                </div>
                
                {sendReceipt && (
                  <div className="space-y-2">
                    <Label>Customer Email</Label>
                    <Input 
                      type="email" 
                      placeholder="customer@email.com" 
                      value={customerEmail}
                      onChange={e => setCustomerEmail(e.target.value)}
                    />
                    {!customerEmail && activeCustomer?.email && (
                      <Button variant="link" className="p-0 h-auto text-xs" onClick={() => setCustomerEmail(activeCustomer.email || '')}>
                        Use {activeCustomer.email}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter className="flex justify-between sm:justify-between w-full">
            {paymentStep === 'method' ? (
              <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>Cancel</Button>
            ) : (
              <Button variant="outline" onClick={() => setPaymentStep(paymentStep === 'tip' ? 'method' : 'tip')}>Back</Button>
            )}
            
            {paymentStep === 'method' && (
              <Button onClick={() => paymentMethod === 'open-tab' ? confirmCharge() : setPaymentStep('tip')} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                {paymentMethod === 'open-tab' ? 'Start Tab' : 'Continue to Tip'}
              </Button>
            )}
            
            {paymentStep === 'tip' && (
              <Button onClick={() => setPaymentStep('receipt')} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                Continue to Receipt
              </Button>
            )}

            {paymentStep === 'receipt' && (
              <Button onClick={confirmCharge} disabled={charging} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                {charging ? 'Processing...' : `Pay ${formatCurrency(total)}`}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>"""
content = re.sub(r"        <DialogContent className=\"sm:max-w-\[400px\]\">.*?</DialogContent>", dialog_content, content, flags=re.DOTALL)

with open('src/components/pos/pos-screen.tsx', 'w') as f:
    f.write(content)

with open('src/app/api/orders/route.ts', 'r') as f:
    api_content = f.read()

# Update API route to handle discount, tip, customerEmail
api_update = """    const { customerName, customerId, location, tabType, items, notes, discount = 0, discountType, tip = 0, customerEmail } = body

    // Get the next order number
    const lastOrder = await db.order.findFirst({
      orderBy: { orderNumber: 'desc' },
      select: { orderNumber: true },
    })
    const nextNumber = (lastOrder?.orderNumber || 1000) + 1

    const itemTotal = items?.reduce((sum: number, item: { price: number; quantity: number }) => {
      return sum + item.price * item.quantity
    }, 0) || 0
    const tax = Math.max(0, itemTotal - (discountType === 'percentage' ? (itemTotal * discount) / 100 : discount)) * 0.08
    const total = Math.max(0, itemTotal - (discountType === 'percentage' ? (itemTotal * discount) / 100 : discount)) + tax + tip"""
api_content = re.sub(r"    const \{ customerName, customerId, location, tabType, items, notes \} = body.*?const total = itemTotal \+ tax", api_update, api_content, flags=re.DOTALL)

api_update2 = """        total,
        discount,
        discountType: discountType || null,
        tip,"""
api_content = api_content.replace("        total,", api_update2)

api_update_put = """    const { id, status, customerName, customerId, location, notes, items, tabType, discount = 0, discountType, tip = 0 } = body"""
api_content = api_content.replace("    const { id, status, customerName, customerId, location, notes, items, tabType } = body", api_update_put)

api_update_put2 = """      const tax = Math.max(0, itemTotal - (discountType === 'percentage' ? (itemTotal * discount) / 100 : discount)) * 0.08
      const total = Math.max(0, itemTotal - (discountType === 'percentage' ? (itemTotal * discount) / 100 : discount)) + tax + tip

      updateData.total = total
      updateData.discount = discount
      updateData.discountType = discountType || null
      updateData.tip = tip"""
api_content = re.sub(r"      const tax = itemTotal \* 0\.08\n      const total = itemTotal \+ tax\n\n      updateData\.total = total", api_update_put2, api_content, flags=re.DOTALL)

with open('src/app/api/orders/route.ts', 'w') as f:
    f.write(api_content)
