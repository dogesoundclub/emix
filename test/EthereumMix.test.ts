import { expect } from "chai";
import { ecsign } from "ethereumjs-util";
import { BigNumber, constants } from "ethers";
import { defaultAbiCoder, hexlify, keccak256, toUtf8Bytes } from "ethers/lib/utils";
import { waffle } from "hardhat";
import EthereumMixArtifact from "../artifacts/contracts/EthereumMix.sol/EthereumMix.json";
import { EthereumMix } from "../typechain/EthereumMix";
import { expandTo18Decimals } from "./shared/utils/number";
import { getERC20ApprovalDigest } from "./shared/utils/standard";

const { deployContract } = waffle;

describe("EthereumMix", () => {
    let token: EthereumMix;

    const provider = waffle.provider;
    const [admin, other] = provider.getWallets();

    const name = "Ethereum Mix";
    const symbol = "EMIX";
    const version = "1";

    beforeEach(async () => {
        token = await deployContract(
            admin,
            EthereumMixArtifact,
            ["0x5307B5E725feB3D6A55605daC1986e3571FB765D"]
        ) as EthereumMix;
    })

    context("new EthereumMix", async () => {
        it("has given data", async () => {
            expect(await token.totalSupply()).to.be.equal(0)
            expect(await token.name()).to.be.equal(name)
            expect(await token.symbol()).to.be.equal(symbol)
            expect(await token.decimals()).to.be.equal(18)
            expect(await token.version()).to.be.equal(version)
        })

        it("data for permit", async () => {
            expect(await token.DOMAIN_SEPARATOR()).to.eq(
                keccak256(
                    defaultAbiCoder.encode(
                        ["bytes32", "bytes32", "bytes32", "uint256", "address"],
                        [
                            keccak256(
                                toUtf8Bytes("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)")
                            ),
                            keccak256(toUtf8Bytes(name)),
                            keccak256(toUtf8Bytes(version)),
                            31337,
                            token.address
                        ]
                    )
                )
            )
            expect(await token.PERMIT_TYPEHASH()).to.eq(
                keccak256(toUtf8Bytes("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"))
            )
        })

        it("permit", async () => {
            const value = expandTo18Decimals(10)

            const nonce = await token.nonces(admin.address)
            const deadline = constants.MaxUint256
            const digest = await getERC20ApprovalDigest(
                token,
                { owner: admin.address, spender: other.address, value },
                nonce,
                deadline
            )

            const { v, r, s } = ecsign(Buffer.from(digest.slice(2), "hex"), Buffer.from(admin.privateKey.slice(2), "hex"))

            await expect(token.permit(admin.address, other.address, value, deadline, v, hexlify(r), hexlify(s)))
                .to.emit(token, "Approval")
                .withArgs(admin.address, other.address, value)
            expect(await token.allowance(admin.address, other.address)).to.eq(value)
            expect(await token.nonces(admin.address)).to.eq(BigNumber.from(1))
        })
    })
})