import { success } from '../utils/dto.js';
const context = req => ({ actor: req.usuario, signal: req.signal, requestId: req.res.locals.requestId });
export function createInventoryController(service) {
    return {
        balance: kind => async (req,res) => success(res,await service.balance(kind,req.params.id,context(req))),
        list: async (req,res) => success(res,await service.listMovements(req.inventoryQuery,context(req))),
        alerts: async (req,res) => success(res,await service.alerts(req.inventoryQuery,context(req))),
        move: async (req,res) => success(res,await service.move(req.input,context(req)),201),
        correct:async(req,res)=>success(res,await service.reviseMovement(req.params.id,req.input,context(req),true)),
        reverse:async(req,res)=>success(res,await service.reviseMovement(req.params.id,req.input,context(req))),
        offers: kind => async (req,res) => success(res,await service.listSnackOffers(kind,req.inventoryQuery,context(req))),
        offer: kind => async (req,res) => success(res,await service.setSnackOffer(kind,req.params.id,req.input,context(req))),
        components: async (req,res) => success(res,await service.snackComponents(req.params.id,context(req))),
        adjustment: async (req,res) => success(res,await service.adjustSnackStock(req.params.id,req.input,context(req)))
    };
}
