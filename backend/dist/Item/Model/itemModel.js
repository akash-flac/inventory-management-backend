"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.assignItemAndUpdateQuantity = exports.updateAssignedItemAndAvailableQuantity = exports.getItemQuantityById = exports.updateItemQuantity = exports.addItem = exports.readItems = exports.readItemByName = exports.readUniqueItem = void 0;
const db_1 = require("../../lib/db");
function readUniqueItem(itemId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield db_1.prisma.item.findUnique({
                where: {
                    itemId: itemId
                }
            });
            return {
                code: 200,
                data: response
            };
        }
        catch (error) {
            return {
                code: 500,
                data: "Error occured while trying to read data!"
            };
        }
    });
}
exports.readUniqueItem = readUniqueItem;
function readItemByName(itemName, location) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield db_1.prisma.item.findUnique({
                where: {
                    unique_location_itemName: {
                        itemName: itemName,
                        location: location
                    }
                }
            });
            return {
                code: 200,
                data: response
            };
        }
        catch (error) {
            return {
                code: 500,
                data: "Error occured while trying to read data!"
            };
        }
    });
}
exports.readItemByName = readItemByName;
function readItems(location) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield db_1.prisma.item.findMany({
                where: {
                    location: location
                }
            });
            return {
                code: 200,
                data: response
            };
        }
        catch (error) {
            return {
                code: 500,
                data: "Error occured while trying to read data!"
            };
        }
    });
}
exports.readItems = readItems;
function addItem(itemName, partNumber, location, quantity, price) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield db_1.prisma.item.create({
                data: {
                    itemName,
                    partNumber,
                    location,
                    quantity,
                    price
                }
            });
            return {
                code: 201,
                data: response
            };
        }
        catch (error) {
            console.log(error);
            return {
                code: 500,
                data: "Unknown database error!",
            };
        }
    });
}
exports.addItem = addItem;
function updateItemQuantity(itemId, quantity) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield db_1.prisma.item.update({
                where: {
                    itemId: itemId
                },
                data: {
                    quantity: quantity
                }
            });
            return {
                code: 201,
                data: response
            };
        }
        catch (error) {
            return {
                code: 500,
                data: "Error in updating",
            };
        }
    });
}
exports.updateItemQuantity = updateItemQuantity;
function getItemQuantityById(itemId) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield db_1.prisma.item.findUnique({
            select: { quantity: true },
            where: { itemId: itemId },
        });
    });
}
exports.getItemQuantityById = getItemQuantityById;
function updateAssignedItemAndAvailableQuantity(row) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            return yield db_1.prisma.$transaction([
                // Increase the quantity of item assigned to the person
                db_1.prisma.assignedItem.update({
                    data: {
                        quantity: {
                            increment: row.quantity
                        }
                    },
                    where: {
                        unique_empId_itemID: {
                            empId: row.empId,
                            itemId: row.itemId
                        }
                    }
                }),
                // Decrease the quantity of item from total items
                db_1.prisma.item.update({
                    data: {
                        quantity: {
                            decrement: row.quantity
                        }
                    },
                    where: {
                        itemId: row.itemId
                    }
                })
            ]);
        }
        catch (err) {
            return null;
        }
    });
}
exports.updateAssignedItemAndAvailableQuantity = updateAssignedItemAndAvailableQuantity;
function assignItemAndUpdateQuantity(row) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            return yield db_1.prisma.$transaction([
                db_1.prisma.assignedItem.create({
                    data: row
                }),
                db_1.prisma.assignedItemRecord.create({
                    data: row
                }),
                // Decrease the quantity of item from total items
                db_1.prisma.item.update({
                    data: {
                        quantity: {
                            decrement: row.quantity
                        }
                    },
                    where: {
                        itemId: row.itemId
                    }
                })
            ]);
        }
        catch (err) {
            return null;
        }
    });
}
exports.assignItemAndUpdateQuantity = assignItemAndUpdateQuantity;
/*
export async function assignItemsToEmployee(empId: number, items: Items, location: string) {

    try {
        console.log("Entering try block")

        let dbData: { empId: number; itemId: number; quantity: number; location: string; }[] = []

        items.forEach((item) => {
            dbData.push({
                empId,
                itemId: item.itemId,
                quantity: item.quantity,
                location
            })
        })

        // Check if all the items that we want to assign the quantities are less than what we have available
        await checkItemQuantities(dbData)
            .then(() => console.log('Quantities checked successfully'))
            .catch(error => console.error('Error checking quantities:', error));


        console.log(dbData)

        let status: boolean[] = [];
        let statusData: any[] = [];

        console.log("Starting Loop!")
        for (const row of dbData) {
            console.log("------ITERATION-----")
            let response = [];
            try {

                if (await checkAssignedItemExists(row.empId, row.itemId)) {
                    console.log("Item is already assigned!")
                    console.log(row)
                    response = await prisma.$transaction([
                        // Increase the quantity of item assigned to the person
                        prisma.assignedItem.update({
                            data: {
                                quantity: {
                                    increment: row.quantity
                                }
                            },
                            where: {
                                unique_empId_itemID: {
                                    empId: row.empId,
                                    itemId: row.itemId
                                }
                            }
                        }),
                        // Decrease the quantity of item from total items
                        prisma.item.update({
                            data: {
                                quantity: {
                                    decrement: row.quantity
                                }
                            },
                            where: {
                                itemId: row.itemId
                            }
                        })
                    ])
                    console.log("Increased the quantiy")
                    console.log("Transaction compleated")

                } else {
                    console.log(`Assignment starting for itemId : ${row.empId}`)
                    console.log(row)

                    response = await prisma.$transaction([
                        prisma.assignedItem.create({
                            data: row
                        }),
                        prisma.assignedItemRecord.create({
                            data: row
                        }),
                        // Decrease the quantity of item from total items
                        prisma.item.update({
                            data: {
                                quantity: {
                                    decrement: row.quantity
                                }
                            },
                            where: {
                                itemId: row.itemId
                            }
                        })

                    ])
                    console.log(`Assignment completed for itemId : ${row.empId}`)
                    console.log("Transaction compleated")

                }


                console.log(response)
                statusData.push(response)
                status.push(true)


            } catch (error) {
                status.push(false)
            }

        }

        return {
            code: 201,
            data: status,
            finalData: statusData
        };

    } catch (error) {
        console.log("Entering error block")
        console.log(error)

        return {
            code: 500,
            data: "Unkown database error"
        }
    }
}

*/ 
